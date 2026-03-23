import { prisma } from '../../config/prisma.js';
import { generateKotNumber } from '../kot/kot.service.js';
import { resolveObjectUrl, uploadObject } from '../../lib/storage.js';
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
    select: { id: true, storeType: true }
  });
  if (!retailer) {
    const error = new Error('Retailer not found');
    error.name = 'NotFoundError';
    throw error;
  }
  return retailer;
};

export const resolveRestaurantRetailerId = async (code: string) => {
  const retailer = await resolveRetailerId(code);

  if (retailer.storeType !== 'RESTAURANT') {
    const error = new Error('Restaurant features are only available for restaurant retailers');
    error.name = 'ForbiddenError';
    throw error;
  }

  return retailer.id;
};

export const getMenuSnapshot = async (retailerId: string) => {
  const resolvedId = await resolveRestaurantRetailerId(retailerId);
  const menuTypes = await prisma.menuType.findMany({
    where: { retailerId: resolvedId },
    orderBy: { name: 'asc' }
  });
  const categories = await prisma.menuCategory.findMany({
    where: { retailerId: resolvedId },
    orderBy: { sortOrder: 'asc' },
    include: {
      menuType: { select: { id: true, name: true } },
      items: {
        orderBy: { sortOrder: 'asc' },
        include: {
          addOnGroups: {
            orderBy: { sortOrder: 'asc' },
            include: { options: { orderBy: { sortOrder: 'asc' } } }
          }
        }
      },
      subCategories: {
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
      }
    }
  });

  return { retailerId, menuTypes, categories };
};

export const upsertMenu = async (retailerId: string, payload: MenuPayloadInput) => {
  return prisma.$transaction(async (tx) => {
    const resolvedId = await resolveRestaurantRetailerId(retailerId);

    // Clear existing menu for the retailer before recreating.
    await tx.menuAddOnOption.deleteMany({
      where: { addOnGroup: { item: { retailerId: resolvedId } } }
    });
    await tx.menuAddOnGroup.deleteMany({
      where: { item: { retailerId: resolvedId } }
    });
    await tx.menuItem.deleteMany({ where: { retailerId: resolvedId } });
    await tx.menuSubCategory.deleteMany({ where: { retailerId: resolvedId } });
    await tx.menuCategory.deleteMany({ where: { retailerId: resolvedId } });
    await tx.menuType.deleteMany({ where: { retailerId: resolvedId } });

    const menuTypeMap = new Map<string, string>();
    for (const type of payload.menuTypes ?? []) {
      const createdType = await tx.menuType.create({
        data: { retailerId: resolvedId, name: type.name }
      });
      menuTypeMap.set(type.name, createdType.id);
    }

    for (const [categoryIndex, category] of payload.categories.entries()) {
      const createdCategory = await tx.menuCategory.create({
        data: {
          retailerId: resolvedId,
          name: category.name,
          description: category.description ?? null,
          sortOrder: categoryIndex,
          menuTypeId: category.menuTypeName ? menuTypeMap.get(category.menuTypeName) ?? null : null
        }
      });

      const createItem = async (
        item: any,
        itemIndex: number,
        subCategoryId?: string | null
      ) => {
        const createdItem = await tx.menuItem.create({
          data: {
            retailerId: resolvedId,
            categoryId: createdCategory.id,
            subCategoryId: subCategoryId ?? null,
            name: item.name,
            description: item.description ?? null,
            sku: item.sku,
            price: item.price,
            imageUrl: item.imageUrl ?? null,
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
              selectionType: group.selectionType ?? 'SINGLE',
              sortOrder: groupIndex
            }
          });

          if (group.options?.length) {
            await tx.menuAddOnOption.createMany({
              data: (group.options ?? []).map((option: any, optionIndex: number) => ({
                addOnGroupId: createdGroup.id,
                label: option.label,
                price: option.price ?? 0,
                isDefault: option.isDefault ?? false,
                sortOrder: optionIndex
              }))
            });
          }
        }
      };

      if (category.subCategories?.length) {
        for (const [subIndex, subCategory] of category.subCategories.entries()) {
          const createdSub = await tx.menuSubCategory.create({
            data: {
              retailerId: resolvedId,
              categoryId: createdCategory.id,
              name: subCategory.name,
              description: subCategory.description ?? null,
              sortOrder: subIndex
            }
          });

          for (const [itemIndex, item] of subCategory.items.entries()) {
            await createItem(item, itemIndex, createdSub.id);
          }
        }
      }

      // Backward compatibility: items directly under category.
      for (const [itemIndex, item] of (category.items ?? []).entries()) {
        await createItem(item, itemIndex, null);
      }
    }

    return getMenuSnapshot(retailerId);
  }, {
    timeout: 15000,
    maxWait: 10000
  });
};

export const listTables = async (retailerId: string) => {
  return prisma.restaurantTable.findMany({
    where: { retailerId: await resolveRestaurantRetailerId(retailerId) },
    orderBy: { label: 'asc' }
  });
};

export const listTokens = async (retailerId: string) => {
  return prisma.restaurantToken.findMany({
    where: { retailerId: await resolveRestaurantRetailerId(retailerId) },
    orderBy: { label: 'asc' }
  });
};

export const upsertToken = async (retailerId: string, label: string) => {
  const resolvedId = await resolveRestaurantRetailerId(retailerId);
  const existing = await prisma.restaurantToken.findFirst({
    where: { retailerId: resolvedId, label }
  });
  if (existing) {
    return existing;
  }
  return prisma.restaurantToken.create({
    data: { retailerId: resolvedId, label }
  });
};

export const deleteToken = async (retailerId: string, tokenId: string) => {
  const token = await prisma.restaurantToken.findFirst({
    where: { id: tokenId, retailerId: await resolveRestaurantRetailerId(retailerId) }
  });
  if (!token) {
    const error = new Error('Token not found');
    error.name = 'NotFoundError';
    throw error;
  }
  await prisma.restaurantToken.delete({ where: { id: tokenId } });
};

export const listTableGroups = async (retailerId: string) => {
  return prisma.restaurantTableGroup.findMany({
    where: { retailerId: await resolveRestaurantRetailerId(retailerId) },
    orderBy: { name: 'asc' }
  });
};

export const createTableGroup = async (retailerId: string, name: string) => {
  const resolvedId = await resolveRestaurantRetailerId(retailerId);
  const existing = await prisma.restaurantTableGroup.findFirst({
    where: { retailerId: resolvedId, name }
  });
  if (existing) {
    return existing;
  }
  return prisma.restaurantTableGroup.create({
    data: { retailerId: resolvedId, name }
  });
};

export const deleteTableGroup = async (retailerId: string, groupId: string) => {
  const tableGroup = await prisma.restaurantTableGroup.findFirst({
    where: { id: groupId, retailerId: await resolveRestaurantRetailerId(retailerId) }
  });
  if (!tableGroup) {
    const error = new Error('Table group not found');
    error.name = 'NotFoundError';
    throw error;
  }
  await prisma.restaurantTableGroup.delete({ where: { id: groupId } });
};

export const listPublicTables = async (retailerCode: string) => {
  return prisma.restaurantTable.findMany({
    where: { retailerId: await resolveRestaurantRetailerId(retailerCode), status: 'AVAILABLE' },
    orderBy: { label: 'asc' }
  });
};

export const upsertTable = async (
  retailerId: string,
  payload: { label: string; capacity: number; status?: string; groupLabel?: string }
) => {
  const resolvedId = await resolveRestaurantRetailerId(retailerId);
  const existing = await prisma.restaurantTable.findFirst({
    where: { retailerId: resolvedId, label: payload.label }
  });

  if (existing) {
    return prisma.restaurantTable.update({
      where: { id: existing.id },
      data: {
        capacity: payload.capacity,
        status: payload.status ?? existing.status,
        groupLabel: payload.groupLabel ?? existing.groupLabel
      }
    });
  }

  return prisma.restaurantTable.create({
    data: {
      retailerId: resolvedId,
      label: payload.label,
      capacity: payload.capacity,
      status: payload.status ?? 'AVAILABLE',
      groupLabel: payload.groupLabel ?? null
    }
  });
};

export const getRestaurantSettings = async (retailerId: string) => {
  const resolvedId = await resolveRestaurantRetailerId(retailerId);
  const settings = await (prisma as any).retailerSettings.findUnique({
    where: { retailerId: resolvedId }
  });
  return (
    settings ?? {
      tableOrderingEnabled: true,
      deliveryOrderingEnabled: true,
      tokenOrderingEnabled: false
    }
  );
};

const normalizeRestaurantSettings = (
  payload: {
    tableOrderingEnabled?: boolean;
    deliveryOrderingEnabled?: boolean;
    tokenOrderingEnabled?: boolean;
  },
  existing?: {
    tableOrderingEnabled?: boolean;
    deliveryOrderingEnabled?: boolean;
    tokenOrderingEnabled?: boolean;
  } | null
) => {
  let tableOrderingEnabled =
    payload.tableOrderingEnabled ?? existing?.tableOrderingEnabled ?? true;
  const deliveryOrderingEnabled =
    payload.deliveryOrderingEnabled ?? existing?.deliveryOrderingEnabled ?? true;
  let tokenOrderingEnabled =
    payload.tokenOrderingEnabled ?? existing?.tokenOrderingEnabled ?? false;

  if (tokenOrderingEnabled) {
    tableOrderingEnabled = false;
  } else if (payload.tableOrderingEnabled == true) {
    tokenOrderingEnabled = false;
  }

  return {
    tableOrderingEnabled,
    deliveryOrderingEnabled,
    tokenOrderingEnabled
  };
};

export const updateRestaurantSettings = async (
  retailerId: string,
  payload: { tableOrderingEnabled?: boolean; deliveryOrderingEnabled?: boolean; tokenOrderingEnabled?: boolean }
) => {
  const resolvedId = await resolveRestaurantRetailerId(retailerId);
  const existing = await (prisma as any).retailerSettings.findUnique({
    where: { retailerId: resolvedId }
  });
  const normalized = normalizeRestaurantSettings(payload, existing);
  return (prisma as any).retailerSettings.upsert({
    where: { retailerId: resolvedId },
    update: normalized,
    create: {
      retailerId: resolvedId,
      ...normalized
    }
  });
};

export const uploadMenuImage = async (
  retailerId: string,
  payload: { fileName: string; contentType: string; data: string }
) => {
  const resolvedId = await resolveRestaurantRetailerId(retailerId);
  const buffer = Buffer.from(payload.data, 'base64');
  const extensionMatch = payload.fileName.match(/\\.([a-zA-Z0-9]+)$/);
  const extension = extensionMatch ? `.${extensionMatch[1]}` : '';
  const filename = `menu-${Date.now()}${extension}`;
  const result = await uploadObject({
    retailerId: resolvedId,
    buffer,
    filename,
    contentType: payload.contentType,
    prefix: 'uploads/menu'
  });
  const url = resolveObjectUrl(result.key);
  return {
    url,
    key: result.key,
    provider: result.provider
  };
};

export const deleteTable = async (retailerId: string, tableId: string) => {
  const resolvedId = await resolveRestaurantRetailerId(retailerId);
  const table = await prisma.restaurantTable.findFirst({
    where: { id: tableId, retailerId: resolvedId }
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
  const resolvedId = await resolveRestaurantRetailerId(retailerId);
  const session = await (prisma as any).selfCheckoutSession.findFirst({
    where: { id: payload.sessionId, retailerId: resolvedId }
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

  return prisma.$transaction(async (tx) => {
    const ticketNumber = session.kotNumber ?? (await generateKotNumber(tx, resolvedId));
    await (tx as any).selfCheckoutSession.update({
      where: { id: payload.sessionId },
      data: { kotNumber: ticketNumber }
    });
    return tx.kitchenTicket.create({
      data: {
        retailerId,
        sessionId: payload.sessionId,
        ticketNumber,
        notes: payload.notes ?? null,
        status: 'QUEUED'
      }
    });
  });
};
