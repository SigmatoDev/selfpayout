import { prisma } from '../../config/prisma';
import type { InventoryItemInput } from './inventory.schema';

export const listInventory = (retailerId: string, search?: string) =>
  prisma.inventoryItem.findMany({
    where: {
      retailerId,
      name: search ? { contains: search, mode: 'insensitive' } : undefined
    },
    orderBy: { updatedAt: 'desc' }
  });

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
