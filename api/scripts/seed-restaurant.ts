import { PrismaClient } from '@prisma/client';

import '../src/config/env';

const prisma = new PrismaClient();

type Args = {
  retailerId?: string;
  email?: string;
  all?: boolean;
  onlyRestaurants?: boolean;
};

const parseArgs = (): Args => {
  const args = process.argv.slice(2);
  const get = (key: string) => {
    const idx = args.indexOf(`--${key}`);
    if (idx === -1) return undefined;
    return args[idx + 1];
  };

  return {
    retailerId: get('retailerId'),
    email: get('email'),
    all: args.includes('--all'),
    onlyRestaurants: args.includes('--only-restaurants')
  };
};

const resolveRetailer = async ({ retailerId, email }: Args) => {
  if (retailerId) {
    const retailer = await prisma.retailer.findUnique({ where: { id: retailerId } });
    if (!retailer) throw new Error(`Retailer not found for id=${retailerId}`);
    return retailer;
  }

  if (email) {
    const retailer = await prisma.retailer.findUnique({ where: { contactEmail: email } });
    if (!retailer) throw new Error(`Retailer not found for email=${email}`);
    return retailer;
  }

  const fallback = await prisma.retailer.findFirst();
  if (!fallback) {
    throw new Error('No retailers found. Provide --retailerId or --email after seeding a retailer.');
  }
  return fallback;
};

const resolveRetailers = async (args: Args) => {
  if (args.all) {
    const where = args.onlyRestaurants ? { storeType: 'RESTAURANT' as const } : undefined;
    const retailers = await prisma.retailer.findMany({ where });
    if (retailers.length === 0) {
      throw new Error('No retailers found for --all (check filters and DB state).');
    }
    return retailers;
  }

  return [await resolveRetailer(args)];
};

const getOrCreateMenuType = async (retailerId: string, name: string) =>
  prisma.menuType.upsert({
    where: { retailerId_menuType: { retailerId, name } },
    create: { retailerId, name },
    update: {}
  });

const getOrCreateCategory = async (retailerId: string, name: string, menuTypeId?: string) => {
  const existing = await prisma.menuCategory.findFirst({
    where: { retailerId, name, menuTypeId }
  });
  if (existing) return existing;
  return prisma.menuCategory.create({
    data: { retailerId, name, menuTypeId }
  });
};

const getOrCreateSubCategory = async (retailerId: string, categoryId: string, name: string) => {
  const existing = await prisma.menuSubCategory.findFirst({
    where: { retailerId, categoryId, name }
  });
  if (existing) return existing;
  return prisma.menuSubCategory.create({
    data: { retailerId, categoryId, name }
  });
};

const upsertMenuItem = async (input: {
  retailerId: string;
  categoryId: string;
  subCategoryId?: string;
  name: string;
  sku: string;
  price: number;
  tags?: string[];
  isVeg?: boolean;
}) =>
  prisma.menuItem.upsert({
    where: { retailer_menu_sku: { retailerId: input.retailerId, sku: input.sku } },
    create: {
      retailerId: input.retailerId,
      categoryId: input.categoryId,
      subCategoryId: input.subCategoryId,
      name: input.name,
      sku: input.sku,
      price: input.price,
      tags: input.tags ?? [],
      isVeg: input.isVeg ?? true
    },
    update: {}
  });

const ensureAddOnGroup = async (itemId: string, name: string, options: Array<{ label: string; price: number }>) => {
  const existingGroup = await prisma.menuAddOnGroup.findFirst({
    where: { itemId, name }
  });
  const group =
    existingGroup ??
    (await prisma.menuAddOnGroup.create({
      data: { itemId, name, min: 0, max: 2, selectionType: 'MULTI' }
    }));

  for (const option of options) {
    const existingOption = await prisma.menuAddOnOption.findFirst({
      where: { addOnGroupId: group.id, label: option.label }
    });
    if (!existingOption) {
      await prisma.menuAddOnOption.create({
        data: { addOnGroupId: group.id, label: option.label, price: option.price }
      });
    }
  }
};

async function seedForRetailer(retailer: { id: string; shopName: string }) {
  console.log(`Seeding restaurant data for retailer: ${retailer.shopName} (${retailer.id})`);

  await prisma.menuAddOnGroup.updateMany({
    where: { item: { retailerId: retailer.id }, selectionType: 'MULTIPLE' },
    data: { selectionType: 'MULTI' }
  });

  await prisma.restaurantTableGroup.createMany({
    data: [
      { retailerId: retailer.id, name: 'Indoor' },
      { retailerId: retailer.id, name: 'Patio' },
      { retailerId: retailer.id, name: 'VIP' }
    ],
    skipDuplicates: true
  });

  await prisma.restaurantTable.createMany({
    data: [
      { retailerId: retailer.id, label: 'T1', groupLabel: 'Indoor', capacity: 2 },
      { retailerId: retailer.id, label: 'T2', groupLabel: 'Indoor', capacity: 4 },
      { retailerId: retailer.id, label: 'T3', groupLabel: 'Indoor', capacity: 6 },
      { retailerId: retailer.id, label: 'P1', groupLabel: 'Patio', capacity: 4 },
      { retailerId: retailer.id, label: 'V1', groupLabel: 'VIP', capacity: 6 }
    ],
    skipDuplicates: true
  });

  await prisma.restaurantToken.createMany({
    data: [
      { retailerId: retailer.id, label: 'A1' },
      { retailerId: retailer.id, label: 'A2' },
      { retailerId: retailer.id, label: 'B1' }
    ],
    skipDuplicates: true
  });

  const vegType = await getOrCreateMenuType(retailer.id, 'Vegetarian');
  const nonVegType = await getOrCreateMenuType(retailer.id, 'Non-Vegetarian');
  const beverageType = await getOrCreateMenuType(retailer.id, 'Beverages');
  const dessertType = await getOrCreateMenuType(retailer.id, 'Desserts');

  const starters = await getOrCreateCategory(retailer.id, 'Starters', vegType.id);
  const mains = await getOrCreateCategory(retailer.id, 'Mains', vegType.id);
  const nonVegStarters = await getOrCreateCategory(retailer.id, 'Starters', nonVegType.id);
  const drinks = await getOrCreateCategory(retailer.id, 'Drinks', beverageType.id);
  const sweets = await getOrCreateCategory(retailer.id, 'Sweets', dessertType.id);

  const curries = await getOrCreateSubCategory(retailer.id, mains.id, 'Curries');
  const breads = await getOrCreateSubCategory(retailer.id, mains.id, 'Breads');

  const paneerTikka = await upsertMenuItem({
    retailerId: retailer.id,
    categoryId: starters.id,
    name: 'Paneer Tikka',
    sku: 'VEG-START-001',
    price: 220,
    tags: ['tandoor', 'spicy'],
    isVeg: true
  });

  const dalMakhani = await upsertMenuItem({
    retailerId: retailer.id,
    categoryId: mains.id,
    subCategoryId: curries.id,
    name: 'Dal Makhani',
    sku: 'VEG-MAIN-001',
    price: 260,
    tags: ['comfort'],
    isVeg: true
  });

  const garlicNaan = await upsertMenuItem({
    retailerId: retailer.id,
    categoryId: mains.id,
    subCategoryId: breads.id,
    name: 'Garlic Naan',
    sku: 'VEG-BREAD-001',
    price: 70,
    tags: ['bread'],
    isVeg: true
  });

  const chicken65 = await upsertMenuItem({
    retailerId: retailer.id,
    categoryId: nonVegStarters.id,
    name: 'Chicken 65',
    sku: 'NV-START-001',
    price: 260,
    tags: ['spicy'],
    isVeg: false
  });

  const masalaChaas = await upsertMenuItem({
    retailerId: retailer.id,
    categoryId: drinks.id,
    name: 'Masala Chaas',
    sku: 'BEV-001',
    price: 60,
    tags: ['cooler'],
    isVeg: true
  });

  const gulabJamun = await upsertMenuItem({
    retailerId: retailer.id,
    categoryId: sweets.id,
    name: 'Gulab Jamun',
    sku: 'DES-001',
    price: 90,
    tags: ['sweet'],
    isVeg: true
  });

  await ensureAddOnGroup(dalMakhani.id, 'Add-ons', [
    { label: 'Extra Butter', price: 20 },
    { label: 'Jeera Rice', price: 90 }
  ]);

  await ensureAddOnGroup(chicken65.id, 'Dips', [
    { label: 'Mint Mayo', price: 15 },
    { label: 'Spicy Garlic', price: 20 }
  ]);

  console.log(
    [
      'Restaurant seed complete.',
      `Retailer: ${retailer.shopName}`,
      'Tables: Indoor/Patio/VIP',
      `Menu items: ${[paneerTikka, dalMakhani, garlicNaan, chicken65, masalaChaas, gulabJamun].length}`
    ].join(' | ')
  );
}

async function main() {
  const args = parseArgs();
  const retailers = await resolveRetailers(args);

  for (const retailer of retailers) {
    await seedForRetailer(retailer);
  }
}

main()
  .catch((error) => {
    console.error('Restaurant seed failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
