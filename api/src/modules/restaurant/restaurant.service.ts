import { prisma } from '../../config/prisma.js';
import type { MenuPayloadInput } from './restaurant.schema.js';

const resolveRetailerId = async (code: string) => {
  const retailer = await prisma.retailer.findFirst({
    where: {
      OR: [
        { id: code },
        { contactEmail: code },
        { shopName: { equals: code, mode: 'insensitive' } }
      ]
    },
    select: { id: true }
  });
  if (!retailer) {
    const error = new Error('Retailer not found');
    error.name = 'NotFoundError';
    throw error;
  }
  return retailer.id;
};

export const getMenuSnapshot = async (retailerId: string) => {
  const categories = await prisma.menuCategory.findMany({
    where: { retailerId: await resolveRetailerId(retailerId) },
    orderBy: { sortOrder: 'asc' },
    include: {
      items: {
        orderBy: { sortOrder: 'asc' },
        include: {
          addOnGroups: {
            orderBy: { sortOrder: 'asc' },
            include: { options: { orderBy: { sortOrder: 'asc' } } }
          }
        }
      }
    }
  });

  return { retailerId, categories };
};

export const upsertMenu = async (retailerId: string, payload: MenuPayloadInput) => {
  return prisma.$transaction(async (tx) => {
    const resolvedId = await resolveRetailerId(retailerId);

    // Clear existing menu for the retailer before recreating.
    await tx.menuAddOnOption.deleteMany({
      where: { addOnGroup: { item: { retailerId: resolvedId } } }
    });
    await tx.menuAddOnGroup.deleteMany({
      where: { item: { retailerId: resolvedId } }
    });
    await tx.menuItem.deleteMany({ where: { retailerId: resolvedId } });
    await tx.menuCategory.deleteMany({ where: { retailerId: resolvedId } });

    for (const [categoryIndex, category] of payload.categories.entries()) {
      const createdCategory = await tx.menuCategory.create({
        data: {
          retailerId: resolvedId,
          name: category.name,
          description: category.description ?? null,
          sortOrder: categoryIndex
        }
      });

      for (const [itemIndex, item] of category.items.entries()) {
        const createdItem = await tx.menuItem.create({
          data: {
            retailerId: resolvedId,
            categoryId: createdCategory.id,
            name: item.name,
            sku: item.sku,
            price: item.price,
            taxPercentage: item.taxPercentage ?? 0,
            tags: item.tags ?? [],
            isVeg: item.isVeg ?? null,
            isAvailable: item.isAvailable ?? true,
            sortOrder: itemIndex
          }
        });

        for (const [groupIndex, group] of (item.addOnGroups ?? []).entries()) {
          const createdGroup = await tx.menuAddOnGroup.create({
            data: {
              itemId: createdItem.id,
              name: group.name,
              min: group.min ?? 0,
              max: group.max ?? 1,
              sortOrder: groupIndex
            }
          });

          if (group.options?.length) {
            await tx.menuAddOnOption.createMany({
              data: (group.options ?? []).map((option, optionIndex) => ({
                addOnGroupId: createdGroup.id,
                label: option.label,
                price: option.price ?? 0,
                isDefault: option.isDefault ?? false,
                sortOrder: optionIndex
              }))
            });
          }
        }
      }
    }

    return getMenuSnapshot(retailerId);
  });
};

export const listTables = async (retailerId: string) => {
  return prisma.restaurantTable.findMany({
    where: { retailerId: await resolveRetailerId(retailerId) },
    orderBy: { label: 'asc' }
  });
};

export const listPublicTables = async (retailerCode: string) => {
  return prisma.restaurantTable.findMany({
    where: { retailerId: await resolveRetailerId(retailerCode), status: 'AVAILABLE' },
    orderBy: { label: 'asc' }
  });
};

export const upsertTable = async (
  retailerId: string,
  payload: { label: string; capacity: number; status?: string }
) => {
  const existing = await prisma.restaurantTable.findFirst({
    where: { retailerId, label: payload.label }
  });

  if (existing) {
    return prisma.restaurantTable.update({
      where: { id: existing.id },
      data: {
        capacity: payload.capacity,
        status: payload.status ?? existing.status
      }
    });
  }

  return prisma.restaurantTable.create({
    data: {
      retailerId,
      label: payload.label,
      capacity: payload.capacity,
      status: payload.status ?? 'AVAILABLE'
    }
  });
};

export const deleteTable = async (retailerId: string, tableId: string) => {
  const table = await prisma.restaurantTable.findFirst({
    where: { id: tableId, retailerId }
  });

  if (!table) {
    const error = new Error('Table not found');
    error.name = 'NotFoundError';
    throw error;
  }

  await prisma.restaurantTable.delete({ where: { id: tableId } });
};

export const createKitchenTicket = async (
  retailerId: string,
  payload: { sessionId: string; notes?: string }
) => {
  const session = await (prisma as any).selfCheckoutSession.findFirst({
    where: { id: payload.sessionId, retailerId }
  });

  if (!session) {
    const error = new Error('Session not found for this retailer');
    error.name = 'NotFoundError';
    throw error;
  }

  const existing = await prisma.kitchenTicket.findUnique({
    where: { sessionId: payload.sessionId }
  });

  if (existing) {
    return existing;
  }

  const ticketNumber = `KOT-${payload.sessionId.slice(0, 6).toUpperCase()}`;

  return prisma.kitchenTicket.create({
    data: {
      retailerId,
      sessionId: payload.sessionId,
      ticketNumber,
      notes: payload.notes ?? null,
      status: 'QUEUED'
    }
  });
};
