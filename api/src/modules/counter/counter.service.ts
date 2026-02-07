import { prisma } from '../../config/prisma.js';
import type { CounterOrderInput } from './counter.schema.js';

export const createCounterOrder = async (retailerId: string, payload: CounterOrderInput) => {
  const retailer = await prisma.retailer.findUnique({ where: { id: retailerId } });
  if (!retailer) {
    const error = new Error('Retailer not found');
    error.name = 'NotFoundError';
    throw error;
  }

  const totalAmount = payload.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return prisma.counterOrder.create({
    data: {
      retailerId,
      customerName: payload.customerName ?? null,
      customerPhone: payload.customerPhone ?? null,
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

export const updateCounterOrderStatus = async (retailerId: string, orderId: string, status: string) => {
  const order = await prisma.counterOrder.findFirst({
    where: { id: orderId, retailerId }
  });
  if (!order) {
    const error = new Error('Order not found');
    error.name = 'NotFoundError';
    throw error;
  }
  return prisma.counterOrder.update({
    where: { id: orderId },
    data: { status }
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
