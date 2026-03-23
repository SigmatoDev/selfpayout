import type { CounterOrderStatus, Prisma } from '@prisma/client';

import { prisma } from '../../config/prisma.js';
import type {
  CounterOrderAppendItemsInput,
  CounterOrderInput
} from './counter.schema.js';
import { generateKotNumber } from '../kot/kot.service.js';
import { consumeCounterOrderIngredients } from '../restaurant/restaurant-stock.service.js';

export const createCounterOrder = async (retailerId: string, payload: CounterOrderInput) => {
  const retailer = await prisma.retailer.findUnique({ where: { id: retailerId } });
  if (!retailer) {
    const error = new Error('Retailer not found');
    error.name = 'NotFoundError';
    throw error;
  }

  const totalAmount = payload.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const kotNumber = await generateKotNumber(tx, retailerId);
    return tx.counterOrder.create({
      data: {
        retailerId,
        customerName: payload.customerName ?? null,
        customerPhone: payload.customerPhone ?? null,
        tableNumber: payload.tableNumber ?? null,
        kotNumber,
        status: payload.paymentMode ? 'PAID' : 'CREATED',
        paymentMode: payload.paymentMode ?? null,
        totalAmount,
        items: {
          create: payload.items.map((item) => ({
            name: item.name,
            sku: item.sku ?? null,
            price: item.price,
            quantity: item.quantity
          }))
        }
      },
      include: { items: true }
    });
  });
};

export const listCounterOrders = async (retailerId: string) => {
  return prisma.counterOrder.findMany({
    where: { retailerId },
    include: { items: true },
    orderBy: { createdAt: 'desc' }
  });
};

export const getCounterOrder = async (retailerId: string, orderId: string) => {
  const order = await prisma.counterOrder.findFirst({
    where: { id: orderId, retailerId },
    include: { items: true }
  });
  if (!order) {
    const error = new Error('Order not found');
    error.name = 'NotFoundError';
    throw error;
  }
  return order;
};

export const updateCounterOrderStatus = async (
  retailerId: string,
  orderId: string,
  status: CounterOrderStatus
) => {
  const order = await prisma.counterOrder.findFirst({
    where: { id: orderId, retailerId }
  });
  if (!order) {
    const error = new Error('Order not found');
    error.name = 'NotFoundError';
    throw error;
  }
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    if (status === 'FULFILLED') {
      await consumeCounterOrderIngredients(tx, orderId, { forceAll: true });
    }

    return tx.counterOrder.update({
      where: { id: orderId },
      data: {
        status,
        fulfilledAt: status === 'FULFILLED' ? new Date() : order.fulfilledAt
      },
      include: { items: true }
    });
  });
};

export const updateCounterOrderItemFulfillment = async (
  retailerId: string,
  orderId: string,
  itemId: string,
  fulfilledQuantity: number
) => {
  const order = await prisma.counterOrder.findFirst({
    where: { id: orderId, retailerId },
    include: { items: true }
  });
  if (!order) {
    const error = new Error('Order not found');
    error.name = 'NotFoundError';
    throw error;
  }

  const item = order.items.find((entry) => entry.id === itemId);
  if (!item) {
    const error = new Error('Order item not found');
    error.name = 'NotFoundError';
    throw error;
  }

  const safeQty = Math.min(Math.max(fulfilledQuantity, 0), item.quantity);
  await prisma.counterOrderItem.update({
    where: { id: itemId },
    data: { fulfilledQuantity: safeQty }
  });

  await consumeCounterOrderIngredients(prisma, orderId, {
    targetItemId: itemId,
    targetFulfilledQuantity: safeQty
  });

  const refreshed = await prisma.counterOrder.findUnique({
    where: { id: orderId },
    include: { items: true }
  });
  if (!refreshed) return order;

  const allFulfilled =
    refreshed.items.length > 0 &&
    refreshed.items.every((entry) => entry.fulfilledQuantity >= entry.quantity);

  return prisma.counterOrder.update({
    where: { id: orderId },
    data: {
      status: allFulfilled ? 'FULFILLED' : refreshed.status,
      fulfilledAt: allFulfilled ? new Date() : refreshed.fulfilledAt
    },
    include: { items: true }
  });
};

export const removeCounterOrderItem = async (
  retailerId: string,
  orderId: string,
  itemId: string
) => {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const order = await tx.counterOrder.findFirst({
      where: { id: orderId, retailerId },
      include: { items: true }
    });
    if (!order) {
      const error = new Error('Order not found');
      error.name = 'NotFoundError';
      throw error;
    }

    if (order.status === 'PAID' || order.status === 'CANCELLED') {
      const error = new Error('Cannot edit a closed order');
      error.name = 'BadRequestError';
      throw error;
    }

    const item = order.items.find((entry) => entry.id === itemId);
    if (!item) {
      const error = new Error('Order item not found');
      error.name = 'NotFoundError';
      throw error;
    }

    if (item.fulfilledQuantity > 0) {
      const error = new Error('Cannot delete an item after fulfillment starts');
      error.name = 'BadRequestError';
      throw error;
    }

    await tx.counterOrderItem.delete({
      where: { id: itemId }
    });

    const remainingItems = order.items.filter((entry) => entry.id != itemId);
    const totalAmount = remainingItems.reduce(
      (sum, entry) => sum + entry.price * entry.quantity,
      0
    );

    if (remainingItems.length === 0) {
      await tx.counterOrder.delete({
        where: { id: order.id }
      });
      const error = new Error('Order is now empty');
      error.name = 'NotFoundError';
      throw error;
    }

    return tx.counterOrder.update({
      where: { id: order.id },
      data: {
        totalAmount,
        status: 'CREATED',
        fulfilledAt: null
      },
      include: { items: true }
    });
  });
};

export const appendCounterOrderItems = async (
  retailerId: string,
  orderId: string,
  payload: CounterOrderAppendItemsInput
) => {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const order = await tx.counterOrder.findFirst({
      where: { id: orderId, retailerId },
      include: { items: true }
    });

    if (!order) {
      const error = new Error('Order not found');
      error.name = 'NotFoundError';
      throw error;
    }

    if (order.status === 'PAID' || order.status === 'CANCELLED') {
      const error = new Error('Cannot add items to a closed order');
      error.name = 'BadRequestError';
      throw error;
    }

    for (const finalItem of payload.items) {
      const matchingItem = order.items.find((entry) => {
        if (finalItem.sku && entry.sku) {
          return entry.sku === finalItem.sku;
        }
        return (
          entry.name.trim().toLowerCase() ===
          finalItem.name.trim().toLowerCase()
        );
      });

      if (matchingItem) {
        await tx.counterOrderItem.update({
          where: { id: matchingItem.id },
          data: {
            quantity: matchingItem.quantity + finalItem.quantity,
            price: finalItem.price
          }
        });
        matchingItem.quantity += finalItem.quantity;
        continue;
      }

      await tx.counterOrderItem.create({
        data: {
          order: { connect: { id: order.id } },
          name: finalItem.name,
          sku: finalItem.sku ?? null,
          price: finalItem.price,
          quantity: finalItem.quantity
        }
      });
      order.items.push({
        id: '',
        orderId: order.id,
        name: finalItem.name,
        sku: finalItem.sku ?? null,
        price: finalItem.price,
        quantity: finalItem.quantity,
        fulfilledQuantity: 0,
        consumedQuantity: 0,
        createdAt: new Date()
      });
    }

    const addedAmount = payload.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    return tx.counterOrder.update({
      where: { id: order.id },
      data: {
        totalAmount: order.totalAmount + addedAmount,
        status: 'CREATED',
        fulfilledAt: null
      },
      include: { items: true }
    });
  });
};

export const markCounterOrdersPaidByPhone = async (
  retailerId: string,
  customerPhone: string,
  paymentMode: 'CASH' | 'UPI' | 'CARD' = 'UPI'
) => {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const orders = await tx.counterOrder.findMany({
      where: {
        retailerId,
        customerPhone,
        status: { in: ['CREATED', 'FULFILLED'] }
      },
      include: { items: true },
      orderBy: { createdAt: 'asc' }
    });

    if (orders.length === 0) {
      const error = new Error('No open counter orders for this customer');
      error.name = 'NotFoundError';
      throw error;
    }

    const invoiceItems = orders.flatMap((order) =>
      order.items.map((item) => ({
        sku: item.sku ?? item.name,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        taxPercentage: 0
      }))
    );

    const subtotalAmount = invoiceItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const taxAmount = 0;
    const totalAmount = subtotalAmount;

    const customer = await tx.customer.upsert({
      where: { retailerId_phone: { retailerId, phone: customerPhone } },
      update: {},
      create: {
        retailerId,
        phone: customerPhone,
        name: 'Customer'
      }
    });

    const invoice = await tx.invoice.create({
      data: {
        retailerId,
        paymentMode,
        customerPhone,
        customerId: customer.id,
        notes: `Counter orders: ${orders.map((order) => order.kotNumber ?? order.id).join(', ')}`,
        subtotalAmount,
        taxAmount,
        totalAmount,
        items: {
          create: invoiceItems.map((item) => ({
            sku: item.sku,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            taxPercentage: item.taxPercentage
          }))
        }
      },
      include: { items: true }
    });

    await tx.counterOrder.updateMany({
      where: { id: { in: orders.map((order) => order.id) } },
      data: {
        status: 'PAID',
        paymentMode,
        fulfilledAt: new Date()
      }
    });

    const refreshed = await tx.counterOrder.findMany({
      where: { id: { in: orders.map((order) => order.id) } },
      include: { items: true },
      orderBy: { createdAt: 'asc' }
    });

    return { invoice, orders: refreshed };
  });
};

export const listAllCounterOrders = async () => {
  return prisma.counterOrder.findMany({
    include: { items: true, retailer: true },
    orderBy: { createdAt: 'desc' }
  });
};

export const getCounterOrderById = async (orderId: string) => {
  const order = await prisma.counterOrder.findUnique({
    where: { id: orderId },
    include: { items: true, retailer: true }
  });
  if (!order) {
    const error = new Error('Order not found');
    error.name = 'NotFoundError';
    throw error;
  }
  return order;
};
