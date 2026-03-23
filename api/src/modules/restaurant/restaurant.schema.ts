import { z } from 'zod';

const nullableOptionalString = () =>
  z.string().nullable().optional().transform((value) => value ?? undefined);

const addOnOptionSchema = z.object({
  id: z.string().optional(),
  label: z.string(),
  price: z.number().nonnegative().default(0),
  isDefault: z.boolean().default(false)
});

const addOnGroupSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  min: z.number().int().nonnegative().default(0),
  max: z.number().int().positive().default(1),
  selectionType: z.enum(['SINGLE', 'MULTI']).default('SINGLE'),
  options: z.array(addOnOptionSchema).default([])
});

const menuItemSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  description: nullableOptionalString(),
  sku: z.string().min(1),
  price: z.number().nonnegative(),
  imageUrl: z.string().url().nullable().optional().transform((value) => value ?? undefined),
  taxPercentage: z.number().min(0).max(28).default(0),
  tags: z.array(z.string()).default([]),
  isVeg: z.boolean().nullable().optional(),
  isAvailable: z.boolean().default(true),
  addOnGroups: z.array(addOnGroupSchema).default([])
});

const menuSubCategorySchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  description: nullableOptionalString(),
  items: z.array(menuItemSchema)
});

const menuCategorySchema = z.object({
  id: z.string().optional(),
  menuTypeName: nullableOptionalString(),
  name: z.string(),
  description: nullableOptionalString(),
  items: z.array(menuItemSchema).default([]),
  subCategories: z.array(menuSubCategorySchema).default([])
});

export const menuPayloadSchema = z.object({
  menuTypes: z.array(z.object({ id: z.string().optional(), name: z.string() })).default([]),
  categories: z.array(menuCategorySchema)
});

export const restaurantMenuParamsSchema = z.object({
  retailerId: z.string().min(3)
});

export const tableListParamsSchema = z.object({
  retailerId: z.string().min(3)
});

export const tableUpsertSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1)
    .regex(/^[0-9-]+$/, 'Table number can contain only numbers and "-"'),
  groupLabel: z.string().trim().min(1).max(40).optional(),
  capacity: z.number().int().positive().max(20),
  status: z.string().optional()
});

export const tokenUpsertSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1)
    .regex(/^[0-9-]+$/, 'Token number can contain only numbers and "-"')
});

export const tableIdSchema = z.object({
  tableId: z.string().uuid()
});

export const tableGroupIdSchema = z.object({
  groupId: z.string().uuid()
});

export const tableGroupSchema = z.object({
  name: z.string().trim().min(1).max(40)
});

export const menuImageUploadSchema = z.object({
  fileName: z.string().min(1),
  contentType: z.string().min(1),
  data: z.string().min(1)
});

export const restaurantSettingsSchema = z.object({
  tableOrderingEnabled: z.boolean().optional(),
  deliveryOrderingEnabled: z.boolean().optional(),
  tokenOrderingEnabled: z.boolean().optional(),
});

const aiServiceModeSchema = z.enum(['TABLE', 'TOKEN', 'DELIVERY']);
const aiVegModeSchema = z.enum(['PURE_VEG', 'MIXED', 'NON_VEG']).default('MIXED');
const aiPriceBandSchema = z.enum(['BUDGET', 'MID_RANGE', 'PREMIUM']).default('MID_RANGE');

export const restaurantAiSetupRequestSchema = z.object({
  restaurantName: z.string().trim().min(1).max(80),
  restaurantType: z.string().trim().min(1).max(80),
  cuisineNote: z.string().trim().max(300).optional(),
  serviceModes: z.array(aiServiceModeSchema).min(1),
  tableCount: z.number().int().min(0).max(200).default(0),
  tokenCount: z.number().int().min(0).max(500).default(0),
  tableAreas: z.array(z.string().trim().min(1).max(40)).max(10).default([]),
  menuCategories: z.array(z.string().trim().min(1).max(40)).min(1).max(12),
  popularItems: z.array(z.string().trim().min(1).max(60)).max(20).default([]),
  vegMode: aiVegModeSchema,
  priceBand: aiPriceBandSchema,
  language: z.string().trim().min(2).max(12).default('en'),
  includeImages: z.boolean().default(false),
  imageStyle: z.string().trim().max(120).optional(),
});

const aiMenuAddOnOptionSchema = z.object({
  label: z.string().trim().min(1).max(60),
  price: z.number().nonnegative().default(0),
  isDefault: z.boolean().default(false),
});

const aiMenuAddOnGroupSchema = z.object({
  name: z.string().trim().min(1).max(60),
  min: z.number().int().nonnegative().default(0),
  max: z.number().int().positive().default(1),
  selectionType: z.enum(['SINGLE', 'MULTI']).default('SINGLE'),
  options: z.array(aiMenuAddOnOptionSchema).max(8).default([]),
});

const aiMenuItemSchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(220).optional(),
  sku: z.string().trim().min(1).max(40),
  price: z.number().nonnegative(),
  taxPercentage: z.number().min(0).max(28).default(5),
  tags: z.array(z.string().trim().min(1).max(24)).max(8).default([]),
  isVeg: z.boolean().nullable().optional(),
  addOnGroups: z.array(aiMenuAddOnGroupSchema).max(6).default([]),
  imagePrompt: z.string().trim().max(240).optional(),
});

const aiMenuSubCategorySchema = z.object({
  name: z.string().trim().min(1).max(60),
  description: z.string().trim().max(180).optional(),
  items: z.array(aiMenuItemSchema).max(12).default([]),
});

const aiMenuCategorySchema = z.object({
  menuTypeName: z.string().trim().min(1).max(40).optional(),
  name: z.string().trim().min(1).max(60),
  description: z.string().trim().max(180).optional(),
  items: z.array(aiMenuItemSchema).max(12).default([]),
  subCategories: z.array(aiMenuSubCategorySchema).max(8).default([]),
});

export const restaurantAiDraftSchema = z.object({
  summary: z.string().trim().min(1).max(500),
  settings: restaurantSettingsSchema,
  tableGroups: z.array(z.object({ name: z.string().trim().min(1).max(40) })).max(10).default([]),
  tables: z.array(
    z.object({
      label: z.string().trim().min(1).regex(/^[0-9-]+$/),
      capacity: z.number().int().positive().max(20),
      groupLabel: z.string().trim().min(1).max(40).optional(),
    })
  ).max(200).default([]),
  tokens: z.array(z.object({ label: z.string().trim().min(1).regex(/^[0-9-]+$/) })).max(500).default([]),
  menuTypes: z.array(z.object({ name: z.string().trim().min(1).max(40) })).max(6).default([]),
  categories: z.array(aiMenuCategorySchema).min(1).max(16),
});

export const restaurantAiImageRequestSchema = z.object({
  itemName: z.string().trim().min(1).max(80),
  prompt: z.string().trim().min(1).max(300).optional(),
  styleHint: z.string().trim().max(120).optional(),
});

export const restaurantAiRecipeDraftRequestSchema = z.object({
  menuItemIds: z.array(z.string().uuid()).max(250).optional(),
});

const restaurantAiRecipeDraftMaterialSchema = z.object({
  rawMaterialId: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(80),
  unit: z.string().trim().min(1).max(20),
  source: z.enum(['EXISTING', 'SUGGESTED']).default('SUGGESTED'),
});

const restaurantAiRecipeDraftItemSchema = z.object({
  rawMaterialId: z.string().uuid().optional(),
  rawMaterialName: z.string().trim().min(1).max(80),
  unit: z.string().trim().min(1).max(20),
  quantity: z.number().positive(),
});

const restaurantAiRecipeDraftSuggestionSchema = z.object({
  menuItemId: z.string().uuid(),
  menuItemName: z.string().trim().min(1).max(80),
  categoryName: z.string().trim().min(1).max(60),
  subCategoryName: z.string().trim().max(60).optional(),
  confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
  notes: z.string().trim().max(220).optional(),
  items: z.array(restaurantAiRecipeDraftItemSchema).max(16).default([]),
});

export const restaurantAiRecipeDraftSchema = z.object({
  summary: z.string().trim().min(1).max(500),
  materials: z.array(restaurantAiRecipeDraftMaterialSchema).max(500).default([]),
  suggestions: z.array(restaurantAiRecipeDraftSuggestionSchema).max(250).default([]),
});

export const kitchenTicketSchema = z.object({
  sessionId: z.string().uuid(),
  notes: z.string().optional()
});

export type MenuPayloadInput = z.infer<typeof menuPayloadSchema>;
export type RestaurantAiSetupRequestInput = z.infer<typeof restaurantAiSetupRequestSchema>;
export type RestaurantAiDraftInput = z.infer<typeof restaurantAiDraftSchema>;
export type RestaurantAiRecipeDraftRequestInput = z.infer<typeof restaurantAiRecipeDraftRequestSchema>;
export type RestaurantAiRecipeDraftInput = z.infer<typeof restaurantAiRecipeDraftSchema>;
