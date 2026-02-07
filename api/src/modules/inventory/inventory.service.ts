import { prisma } from '../../config/prisma.js';
import type { InventoryItemInput } from './inventory.schema.js';

export const listInventory = (retailerId: string, search?: string) =>
  prisma.inventoryItem.findMany({
    where: {
      retailerId,
      name: search ? { contains: search, mode: 'insensitive' } : undefined
    },
    orderBy: { updatedAt: 'desc' }
  });

export const listPublicInventory = (params: {
  retailerId?: string;
  search?: string;
  category?: string;
}) =>
  prisma.inventoryItem.findMany({
    where: {
      retailerId: params.retailerId,
      category: params.category,
      OR: params.search
        ? [
            { name: { contains: params.search, mode: 'insensitive' } },
            { sku: { contains: params.search, mode: 'insensitive' } },
            { category: { contains: params.search, mode: 'insensitive' } }
          ]
        : undefined
    },
    include: {
      retailer: {
        select: { id: true, shopName: true, storeType: true }
      }
    },
    orderBy: { updatedAt: 'desc' }
  });

export const listPublicCategories = async (retailerId?: string) => {
  const results = await prisma.inventoryItem.findMany({
    where: {
      retailerId,
      category: { not: null }
    },
    distinct: ['category'],
    select: { category: true },
    orderBy: { category: 'asc' }
  });
  return results.map((row) => row.category).filter((value): value is string => Boolean(value));
};

export const upsertItem = (input: InventoryItemInput) =>
  prisma.inventoryItem.upsert({
    where: { retailerId_sku: { retailerId: input.retailerId, sku: input.sku } },
    update: input,
    create: input
  });

export const bulkUpload = async (retailerId: string, items: Array<Omit<InventoryItemInput, 'retailerId'>>) => {
  const operations = items.map((item) =>
    prisma.inventoryItem.upsert({
      where: { retailerId_sku: { retailerId, sku: item.sku } },
      update: { ...item, retailerId },
      create: { ...item, retailerId }
    })
  );

  await prisma.$transaction(operations);
};
