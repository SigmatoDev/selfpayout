import type { MarketplaceOrderStatus } from '@prisma/client';

import { prisma } from '../../config/prisma.js';
import type { MarketplaceOrderInput } from './marketplace.schema.js';

const assertMarketplaceRetailer = (
  retailer: { storeType: string; status?: string; settings?: { marketplaceEnabled?: boolean | null } | null } | null
) => {
  if (!retailer) {
    const error = new Error('Retailer not found');
    error.name = 'NotFoundError';
    throw error;
  }

  if (retailer.storeType !== 'KIRANA') {
    const error = new Error('Marketplace is only available for kirana retailers');
    error.name = 'ForbiddenError';
    throw error;
  }

  if (retailer.status && retailer.status !== 'ACTIVE') {
    const error = new Error('Retailer not found');
    error.name = 'NotFoundError';
    throw error;
  }

  if (retailer.settings?.marketplaceEnabled === false) {
    const error = new Error('Marketplace is disabled for this retailer');
    error.name = 'ForbiddenError';
    throw error;
  }
};

export const createMarketplaceOrder = async (consumerId: string | undefined, payload: MarketplaceOrderInput) => {
  const retailer = await prisma.retailer.findUnique({
    where: { id: payload.retailerId },
    include: { settings: { select: { marketplaceEnabled: true } } }
  });
  assertMarketplaceRetailer(retailer);

  const consumer = consumerId ? await prisma.consumer.findUnique({ where: { id: consumerId } }) : null;

  const itemIds = payload.items.map((item) => item.inventoryItemId);
  const inventoryItems = await prisma.inventoryItem.findMany({
    where: { id: { in: itemIds }, retailerId: payload.retailerId }
  });
  const inventoryMap = new Map(inventoryItems.map((item) => [item.id, item]));

  let totalAmount = 0;
  const items = payload.items.map((item) => {
    const inventory = inventoryMap.get(item.inventoryItemId);
    if (!inventory) {
      const error = new Error('Inventory item not found for retailer');
      error.name = 'NotFoundError';
      throw error;
    }
    totalAmount += inventory.price * item.quantity;
    return {
      inventoryItemId: inventory.id,
      name: inventory.name,
      sku: inventory.sku,
      price: inventory.price,
      quantity: item.quantity
    };
  });

  return prisma.marketplaceOrder.create({
    data: {
      retailerId: payload.retailerId,
      consumerId: consumer?.id ?? null,
      buyerName: payload.buyerName ?? consumer?.name ?? 'Customer',
      buyerPhone: payload.buyerPhone,
      status: 'SUBMITTED',
      totalAmount,
      deliveryAddress: payload.deliveryAddress ?? consumer?.address ?? null,
      items: {
        create: items
      }
    },
    include: { items: true }
  });
};

export const listMarketplaceOrdersForConsumer = async (consumerId: string) => {
  return prisma.marketplaceOrder.findMany({
    where: { consumerId },
    include: { items: true, retailer: true },
    orderBy: { createdAt: 'desc' }
  });
};

export const getMarketplaceOrderForConsumer = async (consumerId: string, orderId: string) => {
  const order = await prisma.marketplaceOrder.findFirst({
    where: { id: orderId, consumerId },
    include: { items: true, retailer: true }
  });
  if (!order) {
    const error = new Error('Order not found');
    error.name = 'NotFoundError';
    throw error;
  }
  return order;
};

export const listMarketplaceOrdersForRetailer = async (retailerId: string) => {
  return prisma.marketplaceOrder.findMany({
    where: { retailerId },
    include: { items: true, consumer: true },
    orderBy: { createdAt: 'desc' }
  });
};

export const getMarketplaceOrderForRetailer = async (retailerId: string, orderId: string) => {
  const order = await prisma.marketplaceOrder.findFirst({
    where: { id: orderId, retailerId },
    include: { items: true, consumer: true }
  });
  if (!order) {
    const error = new Error('Order not found');
    error.name = 'NotFoundError';
    throw error;
  }
  return order;
};

export const updateMarketplaceOrderStatus = async (
  retailerId: string,
  orderId: string,
  status: MarketplaceOrderStatus
) => {
  const order = await prisma.marketplaceOrder.findFirst({
    where: { id: orderId, retailerId }
  });
  if (!order) {
    const error = new Error('Order not found');
    error.name = 'NotFoundError';
    throw error;
  }
  return prisma.marketplaceOrder.update({
    where: { id: orderId },
    data: { status }
  });
};

export const listAllMarketplaceOrders = async () => {
  return prisma.marketplaceOrder.findMany({
    include: { items: true, retailer: true, consumer: true },
    orderBy: { createdAt: 'desc' }
  });
};

export const getMarketplaceOrderById = async (orderId: string) => {
  const order = await prisma.marketplaceOrder.findUnique({
    where: { id: orderId },
    include: { items: true, retailer: true, consumer: true }
  });
  if (!order) {
    const error = new Error('Order not found');
    error.name = 'NotFoundError';
    throw error;
  }
  return order;
};
