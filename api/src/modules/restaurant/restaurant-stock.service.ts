import type { Prisma, RawMaterialLedgerType } from '@prisma/client';

import { prisma } from '../../config/prisma.js';
import type {
  RawMaterialAdjustInput,
  RawMaterialUpsertInput,
  RecipeReplaceInput
} from './restaurant-stock.schema.js';
import { resolveRestaurantRetailerId } from './restaurant.service.js';

const ensureMaterialBelongsToRetailer = async (
  tx: Prisma.TransactionClient | typeof prisma,
  retailerId: string,
  materialId: string
) => {
  const material = await tx.rawMaterial.findFirst({
    where: { id: materialId, retailerId }
  });

  if (!material) {
    const error = new Error('Raw material not found');
    error.name = 'NotFoundError';
    throw error;
  }

  return material;
};

const buildDayWindow = (dateText?: string) => {
  const base = dateText ? new Date(`${dateText}T00:00:00.000Z`) : new Date();
  const start = new Date(
    Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate())
  );
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
};

export const listRawMaterials = async (retailerId: string) => {
  const resolvedId = await resolveRestaurantRetailerId(retailerId);
  return prisma.rawMaterial.findMany({
    where: { retailerId: resolvedId },
    orderBy: [{ isActive: 'desc' }, { name: 'asc' }]
  });
};

export const upsertRawMaterial = async (
  retailerId: string,
  input: RawMaterialUpsertInput
) => {
  const resolvedId = await resolveRestaurantRetailerId(retailerId);

  if (input.id) {
    await ensureMaterialBelongsToRetailer(prisma, resolvedId, input.id);
    return prisma.rawMaterial.update({
      where: { id: input.id },
      data: {
        name: input.name,
        unit: input.unit,
        currentStock: input.currentStock,
        reorderLevel: input.reorderLevel,
        costPerUnit: input.costPerUnit,
        isActive: input.isActive
      }
    });
  }

  return prisma.rawMaterial.upsert({
    where: {
      retailer_raw_material_name: {
        retailerId: resolvedId,
        name: input.name
      }
    },
    update: {
      unit: input.unit,
      currentStock: input.currentStock,
      reorderLevel: input.reorderLevel,
      costPerUnit: input.costPerUnit,
      isActive: input.isActive
    },
    create: {
      retailerId: resolvedId,
      name: input.name,
      unit: input.unit,
      currentStock: input.currentStock,
      reorderLevel: input.reorderLevel,
      costPerUnit: input.costPerUnit,
      isActive: input.isActive
    }
  });
};

export const adjustRawMaterialStock = async (
  retailerId: string,
  materialId: string,
  input: RawMaterialAdjustInput
) => {
  const resolvedId = await resolveRestaurantRetailerId(retailerId);

  return prisma.$transaction(async (tx) => {
    const material = await ensureMaterialBelongsToRetailer(tx, resolvedId, materialId);
    const delta =
      input.type === 'WASTAGE'
        ? -Math.abs(input.quantity)
        : input.type === 'PURCHASE'
          ? Math.abs(input.quantity)
          : input.quantity;
    const nextStock = material.currentStock + delta;

    const updated = await tx.rawMaterial.update({
      where: { id: material.id },
      data: { currentStock: nextStock }
    });

    await tx.rawMaterialLedgerEntry.create({
      data: {
        retailerId: resolvedId,
        rawMaterialId: material.id,
        type: input.type,
        quantityDelta: delta,
        previousStock: material.currentStock,
        currentStock: nextStock,
        notes: input.notes ?? null
      }
    });

    return updated;
  });
};

export const listMenuItemRecipes = async (retailerId: string) => {
  const resolvedId = await resolveRestaurantRetailerId(retailerId);
  return prisma.menuItem.findMany({
    where: { retailerId: resolvedId },
    orderBy: [{ category: { sortOrder: 'asc' } }, { sortOrder: 'asc' }, { name: 'asc' }],
    include: {
      category: { select: { id: true, name: true } },
      subCategory: { select: { id: true, name: true } },
      recipeItems: {
        orderBy: { rawMaterial: { name: 'asc' } },
        include: {
          rawMaterial: {
            select: { id: true, name: true, unit: true, currentStock: true }
          }
        }
      }
    }
  });
};

export const replaceMenuItemRecipe = async (
  retailerId: string,
  menuItemId: string,
  input: RecipeReplaceInput
) => {
  const resolvedId = await resolveRestaurantRetailerId(retailerId);
  const menuItem = await prisma.menuItem.findFirst({
    where: { id: menuItemId, retailerId: resolvedId },
    select: { id: true }
  });

  if (!menuItem) {
    const error = new Error('Menu item not found');
    error.name = 'NotFoundError';
    throw error;
  }

  const uniqueIds = new Set<string>();
  for (const item of input.items) {
    if (uniqueIds.has(item.rawMaterialId)) {
      const error = new Error('A raw material can only be mapped once per menu item');
      error.name = 'ValidationError';
      throw error;
    }
    uniqueIds.add(item.rawMaterialId);
  }

  const validMaterials = await prisma.rawMaterial.findMany({
    where: {
      retailerId: resolvedId,
      id: { in: input.items.map((item) => item.rawMaterialId) }
    },
    select: { id: true }
  });

  if (validMaterials.length !== input.items.length) {
    const error = new Error('One or more raw materials were not found');
    error.name = 'NotFoundError';
    throw error;
  }

  await prisma.$transaction(async (tx) => {
    await tx.menuItemRecipeItem.deleteMany({
      where: { menuItemId: menuItem.id }
    });

    if (input.items.length > 0) {
      await tx.menuItemRecipeItem.createMany({
        data: input.items.map((item) => ({
          menuItemId: menuItem.id,
          rawMaterialId: item.rawMaterialId,
          quantity: item.quantity
        }))
      });
    }
  });

  return prisma.menuItem.findUnique({
    where: { id: menuItem.id },
    include: {
      category: { select: { id: true, name: true } },
      subCategory: { select: { id: true, name: true } },
      recipeItems: {
        orderBy: { rawMaterial: { name: 'asc' } },
        include: {
          rawMaterial: {
            select: { id: true, name: true, unit: true, currentStock: true }
          }
        }
      }
    }
  });
};

export const getDailyStockSummary = async (retailerId: string, dateText?: string) => {
  const resolvedId = await resolveRestaurantRetailerId(retailerId);
  const { start, end } = buildDayWindow(dateText);

  const [materials, ledgerSinceStart, ledgerSinceEnd] = await Promise.all([
    prisma.rawMaterial.findMany({
      where: { retailerId: resolvedId },
      orderBy: { name: 'asc' }
    }),
    prisma.rawMaterialLedgerEntry.findMany({
      where: { retailerId: resolvedId, createdAt: { gte: start } }
    }),
    prisma.rawMaterialLedgerEntry.findMany({
      where: { retailerId: resolvedId, createdAt: { gte: end } }
    })
  ]);

  const sinceStartByMaterial = new Map<string, number>();
  for (const entry of ledgerSinceStart) {
    sinceStartByMaterial.set(
      entry.rawMaterialId,
      (sinceStartByMaterial.get(entry.rawMaterialId) ?? 0) + entry.quantityDelta
    );
  }

  const sinceEndByMaterial = new Map<string, number>();
  for (const entry of ledgerSinceEnd) {
    sinceEndByMaterial.set(
      entry.rawMaterialId,
      (sinceEndByMaterial.get(entry.rawMaterialId) ?? 0) + entry.quantityDelta
    );
  }

  const withinDay = ledgerSinceStart.filter((entry) => entry.createdAt < end);
  const movementMap = new Map<
    string,
    { purchase: number; consumption: number; wastage: number; adjustment: number }
  >();

  for (const entry of withinDay) {
    const bucket = movementMap.get(entry.rawMaterialId) ?? {
      purchase: 0,
      consumption: 0,
      wastage: 0,
      adjustment: 0
    };

    if (entry.type === 'PURCHASE') bucket.purchase += entry.quantityDelta;
    if (entry.type === 'CONSUMPTION') bucket.consumption += Math.abs(entry.quantityDelta);
    if (entry.type === 'WASTAGE') bucket.wastage += Math.abs(entry.quantityDelta);
    if (entry.type === 'ADJUSTMENT') bucket.adjustment += entry.quantityDelta;

    movementMap.set(entry.rawMaterialId, bucket);
  }

  return {
    date: start.toISOString().slice(0, 10),
    items: materials.map((material) => {
      const movement = movementMap.get(material.id) ?? {
        purchase: 0,
        consumption: 0,
        wastage: 0,
        adjustment: 0
      };
      const openingStock =
        material.currentStock - (sinceStartByMaterial.get(material.id) ?? 0);
      const closingStock =
        material.currentStock - (sinceEndByMaterial.get(material.id) ?? 0);

      return {
        materialId: material.id,
        materialName: material.name,
        unit: material.unit,
        reorderLevel: material.reorderLevel,
        openingStock,
        purchasedStock: movement.purchase,
        consumedStock: movement.consumption,
        wastageStock: movement.wastage,
        adjustmentStock: movement.adjustment,
        closingStock
      };
    })
  };
};

export const consumeMenuItemsForRetailer = async (
  tx: Prisma.TransactionClient | typeof prisma,
  retailerId: string,
  items: Array<{ sku: string; name?: string | null; quantity: number }>,
  context: {
    referenceType: string;
    referenceId: string;
    notePrefix?: string;
  }
) => {
  const skus = Array.from(
    new Set(items.map((item) => item.sku.trim()).filter((sku) => sku.length > 0))
  );

  if (skus.length === 0) {
    return;
  }

  const menuItems = await tx.menuItem.findMany({
    where: {
      retailerId,
      sku: { in: skus }
    },
    include: {
      recipeItems: {
        include: {
          rawMaterial: true
        }
      }
    }
  });

  const recipeMap = new Map(menuItems.map((item) => [item.sku, item]));
  const aggregated = new Map<
    string,
    { quantity: number; material: { id: string; name: string }; notes: string[] }
  >();

  for (const orderItem of items) {
    const menuItem = recipeMap.get(orderItem.sku);
    if (!menuItem || orderItem.quantity <= 0) continue;

    for (const recipeItem of menuItem.recipeItems) {
      const quantity = recipeItem.quantity * orderItem.quantity;
      const current = aggregated.get(recipeItem.rawMaterialId);
      if (current) {
        current.quantity += quantity;
        current.notes.push(`${menuItem.name} x${orderItem.quantity}`);
      } else {
        aggregated.set(recipeItem.rawMaterialId, {
          quantity,
          material: {
            id: recipeItem.rawMaterial.id,
            name: recipeItem.rawMaterial.name
          },
          notes: [`${menuItem.name} x${orderItem.quantity}`]
        });
      }
    }
  }

  for (const [rawMaterialId, entry] of aggregated.entries()) {
    const material = await tx.rawMaterial.findFirst({
      where: { id: rawMaterialId, retailerId }
    });
    if (!material) continue;

    const nextStock = material.currentStock - entry.quantity;
    await tx.rawMaterial.update({
      where: { id: material.id },
      data: { currentStock: nextStock }
    });

    await tx.rawMaterialLedgerEntry.create({
      data: {
        retailerId,
        rawMaterialId: material.id,
        type: 'CONSUMPTION',
        quantityDelta: -entry.quantity,
        previousStock: material.currentStock,
        currentStock: nextStock,
        referenceType: context.referenceType,
        referenceId: context.referenceId,
        notes: [context.notePrefix, ...entry.notes].filter(Boolean).join(' | ')
      }
    });
  }
};

export const consumeSelfCheckoutSessionIngredients = async (
  tx: Prisma.TransactionClient | typeof prisma,
  sessionId: string
) => {
  const session = await tx.selfCheckoutSession.findUnique({
    where: { id: sessionId },
    include: { items: true, retailer: { select: { storeType: true } } }
  });

  if (!session || session.retailer.storeType !== 'RESTAURANT') {
    return;
  }

  const consumableItems = session.items
    .map((item) => ({
      id: item.id,
      sku: item.sku,
      name: item.name,
      quantity: item.quantity - item.consumedQuantity
    }))
    .filter((item) => item.quantity > 0);

  if (consumableItems.length === 0) {
    return;
  }

  await consumeMenuItemsForRetailer(
    tx,
    session.retailerId,
    consumableItems.map((item) => ({
      sku: item.sku,
      name: item.name,
      quantity: item.quantity
    })),
    {
      referenceType: 'SELF_CHECKOUT_SESSION',
      referenceId: session.id,
      notePrefix: 'Session fulfilled'
    }
  );

  for (const item of consumableItems) {
    const dbItem = session.items.find((entry) => entry.id === item.id);
    await tx.selfCheckoutItem.update({
      where: { id: item.id },
      data: { consumedQuantity: dbItem?.quantity ?? 0 }
    });
  }
};

export const consumeCounterOrderIngredients = async (
  tx: Prisma.TransactionClient | typeof prisma,
  orderId: string,
  options?: { forceAll?: boolean; targetItemId?: string; targetFulfilledQuantity?: number }
) => {
  const order = await tx.counterOrder.findUnique({
    where: { id: orderId },
    include: {
      retailer: { select: { storeType: true } },
      items: true
    }
  });

  if (!order || order.retailer.storeType !== 'RESTAURANT') {
    return;
  }

  const consumableItems = order.items
    .map((item) => {
      const targetQuantity =
        options?.forceAll
          ? item.quantity
          : item.id === options?.targetItemId
            ? options.targetFulfilledQuantity ?? item.fulfilledQuantity
            : item.fulfilledQuantity;

      return {
        id: item.id,
        sku: item.sku,
        name: item.name,
        quantity: Math.max(targetQuantity - item.consumedQuantity, 0),
        consumedTarget: targetQuantity
      };
    })
    .filter((item) => item.quantity > 0 && item.sku);

  if (consumableItems.length === 0) {
    return;
  }

  await consumeMenuItemsForRetailer(
    tx,
    order.retailerId,
    consumableItems.map((item) => ({
      sku: item.sku!,
      name: item.name,
      quantity: item.quantity
    })),
    {
      referenceType: 'COUNTER_ORDER',
      referenceId: order.id,
      notePrefix: order.kotNumber ? `KOT ${order.kotNumber}` : 'Counter order'
    }
  );

  for (const item of consumableItems) {
    await tx.counterOrderItem.update({
      where: { id: item.id },
      data: { consumedQuantity: item.consumedTarget }
    });
  }
};
