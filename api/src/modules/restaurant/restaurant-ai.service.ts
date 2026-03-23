import { prisma } from '../../config/prisma.js';
import { generateAiImage, generateAiJson } from '../../lib/ai.js';
import { resolveObjectUrl, uploadObject } from '../../lib/storage.js';
import { getMenuSnapshot, updateRestaurantSettings, upsertMenu, upsertTable, upsertToken, createTableGroup } from './restaurant.service.js';
import { replaceMenuItemRecipe, upsertRawMaterial } from './restaurant-stock.service.js';
import type {
  RestaurantAiDraftInput,
  RestaurantAiRecipeDraftInput,
  RestaurantAiRecipeDraftRequestInput,
  RestaurantAiSetupRequestInput
} from './restaurant.schema.js';
import { restaurantAiDraftSchema, restaurantAiRecipeDraftSchema } from './restaurant.schema.js';

const createSku = (name: string, retailerName: string, index: number) => {
  const base = `${retailerName}-${name}`
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24);
  return `${base || 'ITEM'}-${index + 1}`;
};

const describeItem = (
  itemName: string,
  answers: RestaurantAiSetupRequestInput,
  categoryName: string
) => {
  const cuisine = answers.cuisineNote?.trim() || answers.restaurantType.trim();
  return `${itemName} from our ${categoryName.toLowerCase()} selection, prepared in a ${cuisine.toLowerCase()} style.`;
};

const buildItemPrompt = (answers: RestaurantAiSetupRequestInput) => `
You are generating a starter restaurant menu for a beginner owner.

Restaurant name: ${answers.restaurantName}
Restaurant type: ${answers.restaurantType}
Cuisine note: ${answers.cuisineNote ?? 'Not specified'}
Service modes: ${answers.serviceModes.join(', ')}
Menu categories requested: ${answers.menuCategories.join(', ')}
Popular items mentioned: ${answers.popularItems.join(', ') || 'None'}
Veg mode: ${answers.vegMode}
Price band: ${answers.priceBand}
Language: ${answers.language}
Include image prompts: ${answers.includeImages ? 'yes' : 'no'}
Preferred image style: ${answers.imageStyle ?? 'natural plated food'}

Return JSON only. Keep it practical for first-time setup. Avoid overly large menus.
Create 4 to 8 categories total, with 2 to 6 items in each category. Use direct category items unless sub-categories are clearly useful.
Each item description should be short and customer-facing.
Prices should be realistic INR starter prices for the price band.
If veg mode is PURE_VEG, every item must be veg. If NON_VEG, avoid veg-only labeling unless natural. If MIXED, include sensible mix.
Use taxPercentage 5 unless a category clearly needs 18.
Do not include markdown.
`;

type GeneratedMenuDraft = {
  summary: string;
  menuTypes?: Array<{ name: string }>;
  categories: Array<{
    menuTypeName?: string;
    name: string;
    description?: string;
    items?: Array<{
      name: string;
      description?: string;
      sku?: string;
      price: number;
      taxPercentage?: number;
      tags?: string[];
      isVeg?: boolean | null;
      addOnGroups?: Array<{
        name: string;
        min?: number;
        max?: number;
        selectionType?: 'SINGLE' | 'MULTI';
        options?: Array<{ label: string; price?: number; isDefault?: boolean }>;
      }>;
      imagePrompt?: string;
    }>;
    subCategories?: Array<{
      name: string;
      description?: string;
      items?: Array<{
        name: string;
        description?: string;
        sku?: string;
        price: number;
        taxPercentage?: number;
        tags?: string[];
        isVeg?: boolean | null;
        addOnGroups?: Array<{
          name: string;
          min?: number;
          max?: number;
          selectionType?: 'SINGLE' | 'MULTI';
          options?: Array<{ label: string; price?: number; isDefault?: boolean }>;
        }>;
        imagePrompt?: string;
      }>;
    }>;
  }>;
};

type GeneratedMenuCategory = NonNullable<GeneratedMenuDraft['categories']>[number];

type GeneratedRecipeDraft = {
  summary: string;
  suggestions: Array<{
    menuItemName: string;
    confidence?: 'HIGH' | 'MEDIUM' | 'LOW';
    notes?: string;
    items: Array<{
      rawMaterialName: string;
      unit: string;
      quantity: number;
    }>;
  }>;
};

type RecipeDraftMenuItem = {
  menuItemId: string;
  menuItemName: string;
  categoryName: string;
  subCategoryName?: string;
  description?: string | null;
  price: number;
  tags: string[];
  isVeg: boolean | null;
  sku: string;
  existingRecipeItems: Array<{
    rawMaterialId: string;
    rawMaterialName: string;
    unit: string;
    quantity: number;
  }>;
};

const normalizeMaterialKey = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, ' ');

const titleCaseMaterialName = (value: string) =>
  value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(' ');

const normalizeUnit = (unit: string) => {
  const key = unit.trim().toLowerCase();
  if (!key) return 'pcs';

  const aliases: Record<string, string> = {
    kilogram: 'kg',
    kilograms: 'kg',
    kilo: 'kg',
    kilos: 'kg',
    kg: 'kg',
    gram: 'g',
    grams: 'g',
    g: 'g',
    litre: 'ltr',
    litres: 'ltr',
    liter: 'ltr',
    liters: 'ltr',
    ltr: 'ltr',
    l: 'ltr',
    millilitre: 'ml',
    millilitres: 'ml',
    milliliter: 'ml',
    milliliters: 'ml',
    ml: 'ml',
    piece: 'pcs',
    pieces: 'pcs',
    pc: 'pcs',
    pcs: 'pcs',
    nos: 'pcs',
    number: 'pcs',
    numbers: 'pcs'
  };

  return aliases[key] ?? key;
};

const convertQuantityToUnit = (quantity: number, fromUnit: string, toUnit: string) => {
  const source = normalizeUnit(fromUnit);
  const target = normalizeUnit(toUnit);

  if (source === target) {
    return quantity;
  }

  const conversions: Record<string, Record<string, number>> = {
    g: { kg: 0.001 },
    kg: { g: 1000 },
    ml: { ltr: 0.001 },
    ltr: { ml: 1000 }
  };

  const ratio = conversions[source]?.[target];
  return ratio ? quantity * ratio : quantity;
};

const inferMenuTypes = (
  answers: RestaurantAiSetupRequestInput,
  categories: GeneratedMenuCategory[]
) => {
  const explicitTypes = Array.from(
    new Set(
      (categories ?? [])
        .map((category) => category.menuTypeName?.trim())
        .filter((value): value is string => Boolean(value))
    )
  );

  if (explicitTypes.length > 0) {
    return explicitTypes;
  }

  if (answers.vegMode === 'PURE_VEG') {
    return ['Veg'];
  }

  if (answers.vegMode === 'NON_VEG') {
    return ['Non-veg'];
  }

  return ['Veg', 'Non-veg'];
};

const inferCategoryMenuType = (
  answers: RestaurantAiSetupRequestInput,
  category: GeneratedMenuCategory,
  availableTypes: string[]
) => {
  if (category.menuTypeName?.trim()) {
    return category.menuTypeName.trim();
  }

  if (availableTypes.length === 1) {
    return availableTypes[0];
  }

  const allItems = [
    ...(category.items ?? []),
    ...(category.subCategories ?? []).flatMap((subCategory) => subCategory.items ?? [])
  ];

  const hasVegItem = allItems.some((item) => item.isVeg === true);
  const hasNonVegItem = allItems.some((item) => item.isVeg === false);

  if (hasVegItem && !hasNonVegItem && availableTypes.includes('Veg')) {
    return 'Veg';
  }

  if (hasNonVegItem && !hasVegItem && availableTypes.includes('Non-veg')) {
    return 'Non-veg';
  }

  return availableTypes[0];
};

const defaultItemsForCategory = (categoryName: string, answers: RestaurantAiSetupRequestInput) => {
  const lower = categoryName.toLowerCase();
  const vegItem = answers.vegMode === 'NON_VEG' ? false : true;
  const nonVegAllowed = answers.vegMode !== 'PURE_VEG';

  const item = (name: string, price: number, options?: { isVeg?: boolean | null; tags?: string[] }) => ({
    name,
    price,
    isVeg: options?.isVeg ?? vegItem,
    tags: options?.tags ?? [],
    taxPercentage: 5,
    description: `${name} prepared in a simple house style, suitable for everyday service.`,
    addOnGroups: [] as Array<{
      name: string;
      min?: number;
      max?: number;
      selectionType?: 'SINGLE' | 'MULTI';
      options?: Array<{ label: string; price?: number; isDefault?: boolean }>;
    }>
  });

  if (lower.includes('starter') || lower.includes('snack') || lower.includes('appetizer')) {
    return [
      item('Crispy Veg Starter', 159, { isVeg: true, tags: ['starter'] }),
      item(nonVegAllowed ? 'Spicy Chicken Starter' : 'Paneer Tikka Bites', nonVegAllowed ? 199 : 189, {
        isVeg: nonVegAllowed ? false : true,
        tags: ['starter']
      })
    ];
  }

  if (lower.includes('bread') || lower.includes('roti') || lower.includes('naan')) {
    return [
      item('Butter Roti', 35, { isVeg: true, tags: ['bread'] }),
      item('Garlic Naan', 65, { isVeg: true, tags: ['bread'] })
    ];
  }

  if (lower.includes('rice') || lower.includes('biryani')) {
    return [
      item('Veg Fried Rice', 149, { isVeg: true, tags: ['rice'] }),
      item(nonVegAllowed ? 'Chicken Biryani' : 'Jeera Rice', nonVegAllowed ? 229 : 129, {
        isVeg: nonVegAllowed ? false : true,
        tags: ['rice']
      })
    ];
  }

  if (lower.includes('drink') || lower.includes('beverage') || lower.includes('juice')) {
    return [
      item('Fresh Lime Soda', 69, { isVeg: true, tags: ['beverage'] }),
      item('Cold Coffee', 119, { isVeg: true, tags: ['beverage'] })
    ];
  }

  if (lower.includes('dessert') || lower.includes('sweet')) {
    return [
      item('Gulab Jamun', 79, { isVeg: true, tags: ['dessert'] }),
      item('Ice Cream Sundae', 119, { isVeg: true, tags: ['dessert'] })
    ];
  }

  if (lower.includes('main') || lower.includes('curry') || lower.includes('course')) {
    return [
      item('Paneer Butter Masala', 229, { isVeg: true, tags: ['main-course'] }),
      item(nonVegAllowed ? 'Chicken Curry' : 'Dal Tadka', nonVegAllowed ? 249 : 169, {
        isVeg: nonVegAllowed ? false : true,
        tags: ['main-course']
      })
    ];
  }

  return [
    item(`${categoryName} Special`, 149, { tags: ['house-special'] }),
    item(`${categoryName} Deluxe`, 189, {
      isVeg: nonVegAllowed ? null : true,
      tags: ['house-special']
    })
  ];
};

const defaultSubCategoryName = (
  categoryName: string,
  answers: RestaurantAiSetupRequestInput
) => {
  const lower = categoryName.toLowerCase();
  const cuisine = (answers.cuisineNote ?? answers.restaurantType).toLowerCase();
  if (lower.includes('starter') || lower.includes('snack') || lower.includes('appetizer')) {
    if (cuisine.includes('chinese')) return 'Quick bites';
    if (cuisine.includes('south')) return 'Tiffin favourites';
    if (cuisine.includes('bakery')) return 'Fresh bakes';
    return 'Popular starters';
  }
  if (lower.includes('bread') || lower.includes('roti') || lower.includes('naan')) {
    if (cuisine.includes('north')) return 'Tandoor breads';
    return 'Fresh breads';
  }
  if (lower.includes('rice') || lower.includes('biryani')) {
    if (lower.includes('biryani')) return 'Biryani specials';
    return 'Rice specials';
  }
  if (lower.includes('drink') || lower.includes('beverage') || lower.includes('juice')) {
    if (cuisine.includes('cafe')) return 'Cafe beverages';
    return 'House drinks';
  }
  if (lower.includes('dessert') || lower.includes('sweet')) {
    if (cuisine.includes('bakery')) return 'Dessert counter';
    return 'Sweet picks';
  }
  if (lower.includes('main') || lower.includes('curry') || lower.includes('course')) {
    if (cuisine.includes('south')) return 'Meal combinations';
    if (cuisine.includes('chinese')) return 'Signature mains';
    return 'Chef specials';
  }
  return 'Popular picks';
};

const buildFallbackCategories = (answers: RestaurantAiSetupRequestInput): GeneratedMenuCategory[] =>
  answers.menuCategories.map((categoryName) => ({
    name: categoryName,
    description: `${categoryName} favourites for ${answers.restaurantName}.`,
    items: [],
    subCategories: [
      {
        name: defaultSubCategoryName(categoryName, answers),
        description: `Starter ${categoryName.toLowerCase()} selection.`,
        items: defaultItemsForCategory(categoryName, answers).map((item) => ({
          ...item,
          imagePrompt: answers.includeImages
            ? `Create a realistic restaurant menu photo for ${item.name} from ${answers.restaurantName}. ${answers.imageStyle ?? 'Natural plated food photo'}. No text overlay.`
            : undefined
        }))
      }
    ]
  }));

const buildSettings = (answers: RestaurantAiSetupRequestInput) => ({
  tableOrderingEnabled:
    answers.serviceModes.includes('TABLE') &&
    !answers.serviceModes.includes('TOKEN'),
  tokenOrderingEnabled: answers.serviceModes.includes('TOKEN'),
  deliveryOrderingEnabled: answers.serviceModes.includes('DELIVERY')
});

const buildTableGroups = (answers: RestaurantAiSetupRequestInput) =>
  answers.serviceModes.includes('TABLE')
    ? (answers.tableAreas.length > 0 ? answers.tableAreas : ['Main hall']).map((name) => ({ name }))
    : [];

const buildTables = (answers: RestaurantAiSetupRequestInput) => {
  if (!answers.serviceModes.includes('TABLE') || answers.tableCount <= 0) {
    return [];
  }

  const areaNames = buildTableGroups(answers).map((group) => group.name);
  return Array.from({ length: answers.tableCount }, (_, index) => ({
    label: `${index + 1}`,
    capacity: index % 4 === 0 ? 4 : 2,
    groupLabel: areaNames.length > 1 ? areaNames[index % areaNames.length] : areaNames[0]
  }));
};

const buildTokens = (answers: RestaurantAiSetupRequestInput) => {
  if (!answers.serviceModes.includes('TOKEN') || answers.tokenCount <= 0) {
    return [];
  }

  return Array.from({ length: answers.tokenCount }, (_, index) => ({ label: `${index + 1}` }));
};

const normalizeDraft = (answers: RestaurantAiSetupRequestInput, generated: GeneratedMenuDraft): RestaurantAiDraftInput => {
  if (!generated || typeof generated !== 'object') {
    const error = new Error('AI did not return a valid restaurant draft');
    error.name = 'ValidationError';
    throw error;
  }

  const categories =
    Array.isArray(generated.categories) && generated.categories.length > 0
      ? generated.categories
      : buildFallbackCategories(answers);
  const menuTypeNames = inferMenuTypes(answers, categories);

  let itemCounter = 0;
  const draft = {
    summary: generated.summary?.trim() || `Starter setup for ${answers.restaurantName}`,
    settings: buildSettings(answers),
    tableGroups: buildTableGroups(answers),
    tables: buildTables(answers),
    tokens: buildTokens(answers),
    menuTypes: menuTypeNames.map((name) => ({ name })),
    categories: categories.map((category) => ({
      menuTypeName: inferCategoryMenuType(answers, category, menuTypeNames),
      name: category.name,
      description: category.description,
      items: (category.items ?? []).map((item) => {
        itemCounter += 1;
        return {
          ...item,
          description:
            item.description?.trim() || describeItem(item.name, answers, category.name),
          sku: item.sku?.trim() || createSku(item.name, answers.restaurantName, itemCounter - 1),
        };
      }),
      subCategories: (category.subCategories ?? []).map((subCategory) => ({
        name: subCategory.name,
        description: subCategory.description,
        items: (subCategory.items ?? []).map((item) => {
          itemCounter += 1;
          return {
            ...item,
            description:
              item.description?.trim() || describeItem(item.name, answers, category.name),
            sku: item.sku?.trim() || createSku(item.name, answers.restaurantName, itemCounter - 1),
          };
        })
      }))
    }))
  };

  return restaurantAiDraftSchema.parse(draft);
};

export const generateRestaurantSetupDraft = async (answers: RestaurantAiSetupRequestInput) => {
  const systemPrompt =
    'You are an operations consultant for small restaurants in India. Produce structured starter setups that are practical, not fancy.';

  try {
    const generated = await generateAiJson<GeneratedMenuDraft>({
      systemPrompt,
      prompt: buildItemPrompt(answers),
      temperature: 0.5,
      maxOutputTokens: 5000
    });

    return normalizeDraft(answers, generated);
  } catch (error) {
    const fallbackDraft: GeneratedMenuDraft = {
      summary: `Starter setup for ${answers.restaurantName} based on your inputs.`,
      categories: buildFallbackCategories(answers)
    };

    return normalizeDraft(answers, fallbackDraft);
  }
};

const toMenuPayload = (draft: RestaurantAiDraftInput) => ({
  menuTypes: draft.menuTypes.map((type) => ({ name: type.name })),
  categories: draft.categories.map((category) => ({
    menuTypeName: category.menuTypeName,
    name: category.name,
    description: category.description,
    items: category.items.map((item) => ({
      name: item.name,
      description: item.description,
      sku: item.sku,
      price: item.price,
      taxPercentage: item.taxPercentage,
      tags: item.tags,
      isVeg: item.isVeg,
      isAvailable: true,
      addOnGroups: item.addOnGroups
    })),
    subCategories: category.subCategories.map((subCategory) => ({
      name: subCategory.name,
      description: subCategory.description,
      items: subCategory.items.map((item) => ({
        name: item.name,
        description: item.description,
        sku: item.sku,
        price: item.price,
        taxPercentage: item.taxPercentage,
        tags: item.tags,
        isVeg: item.isVeg,
        isAvailable: true,
        addOnGroups: item.addOnGroups
      }))
    }))
  }))
});

const buildRecipeResearchPrompt = (
  retailerName: string,
  menuItems: RecipeDraftMenuItem[],
  existingMaterials: Array<{ id: string; name: string; unit: string }>
) => `
You are a restaurant operations assistant preparing ingredient mappings for stock tracking.

Objective:
- Infer practical per-serving raw material usage for each menu item.
- Use common Indian restaurant patterns first, and broadly accepted global restaurant conventions when relevant.
- Return realistic kitchen-level estimates, not home recipe quantities.
- Focus on ingredients that materially affect stock, not garnish noise.

Rules:
- Return JSON only.
- Use the exact menuItemName values provided.
- For each menu item, return 2 to 8 core ingredients.
- Quantities must be per 1 serving / 1 sold unit.
- Prefer grams (g), kilograms (kg), millilitres (ml), litres (ltr), or pieces (pcs).
- Reuse existing raw material names and units when a close match exists.
- Keep names generic and stock-friendly. Example: use "Onion", not "Fresh sliced onion for gravy".
- If an item is too variable or brand-specific, lower confidence and explain briefly in notes.

Retailer: ${retailerName}

Existing raw materials:
${existingMaterials.length > 0
    ? existingMaterials.map((material) => `- ${material.name} (${material.unit})`).join('\n')
    : '- None yet'}

Menu items:
${menuItems
    .map((item) =>
      [
        `- menuItemName: ${item.menuItemName}`,
        `  categoryName: ${item.categoryName}`,
        item.subCategoryName ? `  subCategoryName: ${item.subCategoryName}` : null,
        `  sku: ${item.sku}`,
        item.description?.trim() ? `  description: ${item.description.trim()}` : null,
        `  priceInr: ${item.price}`,
        `  veg: ${item.isVeg === null ? 'unknown' : item.isVeg ? 'yes' : 'no'}`,
        item.tags.length > 0 ? `  tags: ${item.tags.join(', ')}` : null,
        item.existingRecipeItems.length > 0
          ? `  existingRecipe: ${item.existingRecipeItems
              .map((entry) => `${entry.rawMaterialName} ${entry.quantity} ${entry.unit}`)
              .join(', ')}`
          : null
      ]
        .filter(Boolean)
        .join('\n')
    )
    .join('\n')}

Return this shape:
{
  "summary": "short summary",
  "suggestions": [
    {
      "menuItemName": "exact menu item name",
      "confidence": "HIGH" | "MEDIUM" | "LOW",
      "notes": "optional short note",
      "items": [
        {
          "rawMaterialName": "Onion",
          "unit": "g",
          "quantity": 40
        }
      ]
    }
  ]
}
`;

export const applyRestaurantSetupDraft = async (retailerId: string, draft: RestaurantAiDraftInput) => {
  await updateRestaurantSettings(retailerId, draft.settings);

  for (const group of draft.tableGroups) {
    await createTableGroup(retailerId, group.name);
  }

  for (const table of draft.tables) {
    await upsertTable(retailerId, table);
  }

  for (const token of draft.tokens) {
    await upsertToken(retailerId, token.label);
  }

  await upsertMenu(retailerId, toMenuPayload(draft));

  return getMenuSnapshot(retailerId);
};

export const generateRestaurantRecipeDraft = async (
  retailerId: string,
  request: RestaurantAiRecipeDraftRequestInput
) => {
  const retailer = await prisma.retailer.findUnique({
    where: { id: retailerId },
    select: { id: true, shopName: true }
  });

  if (!retailer) {
    const error = new Error('Retailer not found');
    error.name = 'NotFoundError';
    throw error;
  }

  const menuItems = await prisma.menuItem.findMany({
    where: {
      retailerId,
      ...(request.menuItemIds?.length ? { id: { in: request.menuItemIds } } : {})
    },
    orderBy: [{ category: { sortOrder: 'asc' } }, { sortOrder: 'asc' }, { name: 'asc' }],
    include: {
      category: { select: { name: true } },
      subCategory: { select: { name: true } },
      recipeItems: {
        include: {
          rawMaterial: {
            select: { id: true, name: true, unit: true }
          }
        }
      }
    }
  });

  if (menuItems.length === 0) {
    const error = new Error('No menu items found for AI recipe mapping');
    error.name = 'ValidationError';
    throw error;
  }

  const existingMaterials = await prisma.rawMaterial.findMany({
    where: { retailerId },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, unit: true }
  });

  const menuDraftItems: RecipeDraftMenuItem[] = menuItems.map((item) => ({
    menuItemId: item.id,
    menuItemName: item.name,
    categoryName: item.category.name,
    subCategoryName: item.subCategory?.name ?? undefined,
    description: item.description,
    price: Number(item.price),
    tags: item.tags,
    isVeg: item.isVeg,
    sku: item.sku,
    existingRecipeItems: item.recipeItems.map((entry) => ({
      rawMaterialId: entry.rawMaterialId,
      rawMaterialName: entry.rawMaterial.name,
      unit: entry.rawMaterial.unit,
      quantity: Number(entry.quantity)
    }))
  }));

  const aiResult = await generateAiJson<GeneratedRecipeDraft>({
    systemPrompt:
      'You are a kitchen operations assistant for Indian restaurants. Estimate practical stock-tracking recipes, not fine-dining recipe cards.',
    prompt: buildRecipeResearchPrompt(
      retailer.shopName ?? 'Restaurant',
      menuDraftItems,
      existingMaterials
    ),
    temperature: 0.2,
    maxOutputTokens: 7000
  });

  const existingByName = new Map(
    existingMaterials.map((material) => [normalizeMaterialKey(material.name), material])
  );
  const itemByName = new Map(menuDraftItems.map((item) => [item.menuItemName.trim().toLowerCase(), item]));

  const normalizedSuggestions = (aiResult.suggestions ?? [])
    .map((suggestion) => {
      const menuItem = itemByName.get(suggestion.menuItemName.trim().toLowerCase());
      if (!menuItem) {
        return null;
      }

      const items = (suggestion.items ?? [])
        .map((entry) => {
          const normalizedName = titleCaseMaterialName(entry.rawMaterialName);
          const existingMaterial = existingByName.get(normalizeMaterialKey(normalizedName));
          const preferredUnit = existingMaterial?.unit ?? normalizeUnit(entry.unit);
          const quantity = convertQuantityToUnit(entry.quantity, entry.unit, preferredUnit);

          if (!normalizedName || !Number.isFinite(quantity) || quantity <= 0) {
            return null;
          }

          return {
            rawMaterialId: existingMaterial?.id,
            rawMaterialName: existingMaterial?.name ?? normalizedName,
            unit: preferredUnit,
            quantity: Number(quantity.toFixed(3))
          };
        })
        .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

      return {
        menuItemId: menuItem.menuItemId,
        menuItemName: menuItem.menuItemName,
        categoryName: menuItem.categoryName,
        subCategoryName: menuItem.subCategoryName,
        confidence: suggestion.confidence ?? 'MEDIUM',
        notes: suggestion.notes?.trim() || undefined,
        items
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  const materialMap = new Map<
    string,
    { rawMaterialId?: string; name: string; unit: string; source: 'EXISTING' | 'SUGGESTED' }
  >();

  for (const material of existingMaterials) {
    materialMap.set(normalizeMaterialKey(material.name), {
      rawMaterialId: material.id,
      name: material.name,
      unit: material.unit,
      source: 'EXISTING'
    });
  }

  for (const suggestion of normalizedSuggestions) {
    for (const item of suggestion.items) {
      const key = normalizeMaterialKey(item.rawMaterialName);
      if (!materialMap.has(key)) {
        materialMap.set(key, {
          rawMaterialId: item.rawMaterialId,
          name: item.rawMaterialName,
          unit: item.unit,
          source: item.rawMaterialId ? 'EXISTING' : 'SUGGESTED'
        });
      }
    }
  }

  return restaurantAiRecipeDraftSchema.parse({
    summary: aiResult.summary?.trim() || 'AI suggested recipe mappings for the current menu.',
    materials: Array.from(materialMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
    suggestions: normalizedSuggestions
  });
};

export const applyRestaurantRecipeDraft = async (
  retailerId: string,
  draft: RestaurantAiRecipeDraftInput
) => {
  const parsed = restaurantAiRecipeDraftSchema.parse(draft);
  const existingMaterials = await prisma.rawMaterial.findMany({
    where: { retailerId },
    select: { id: true, name: true, unit: true }
  });
  const materialById = new Map(existingMaterials.map((material) => [material.id, material]));
  const materialByName = new Map(
    existingMaterials.map((material) => [normalizeMaterialKey(material.name), material])
  );

  let createdRawMaterialsCount = 0;

  for (const suggestion of parsed.suggestions) {
    const items: Array<{ rawMaterialId: string; quantity: number }> = [];

    for (const entry of suggestion.items) {
      let material =
        (entry.rawMaterialId ? materialById.get(entry.rawMaterialId) : undefined) ??
        materialByName.get(normalizeMaterialKey(entry.rawMaterialName));

      if (!material) {
        const created = await upsertRawMaterial(retailerId, {
          name: titleCaseMaterialName(entry.rawMaterialName),
          unit: normalizeUnit(entry.unit),
          currentStock: 0,
          reorderLevel: 0,
          costPerUnit: 0,
          isActive: true
        });
        material = {
          id: created.id,
          name: created.name,
          unit: created.unit
        };
        materialById.set(material.id, material);
        materialByName.set(normalizeMaterialKey(material.name), material);
        createdRawMaterialsCount += 1;
      }

      items.push({
        rawMaterialId: material.id,
        quantity: Number(
          convertQuantityToUnit(entry.quantity, entry.unit, material.unit).toFixed(3)
        )
      });
    }

    await replaceMenuItemRecipe(retailerId, suggestion.menuItemId, { items });
  }

  return {
    updatedMenuItemCount: parsed.suggestions.length,
    createdRawMaterialsCount
  };
};

export const generateRestaurantMenuItemImage = async (
  retailerId: string,
  params: { itemName: string; prompt?: string; styleHint?: string }
) => {
  const prompt =
    params.prompt?.trim() ||
    `Create a clean menu photo of ${params.itemName}. ${params.styleHint ? `Style: ${params.styleHint}.` : ''} Use natural lighting, realistic plating, and no text overlay.`;

  const image = await generateAiImage({
    prompt,
    quality: 'low',
    size: '1024x1024'
  });

  const extension = image.mimeType === 'image/jpeg' ? 'jpg' : 'png';
  const upload = await uploadObject({
    retailerId,
    buffer: Buffer.from(image.base64Data, 'base64'),
    filename: `ai-${Date.now()}.${extension}`,
    contentType: image.mimeType,
    prefix: 'uploads/menu-ai'
  });

  return {
    url: resolveObjectUrl(upload.key),
    key: upload.key,
    provider: image.provider,
    model: image.model,
    prompt
  };
};
