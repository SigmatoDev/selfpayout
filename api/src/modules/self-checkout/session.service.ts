import { randomBytes } from 'crypto';

import type { Prisma } from '@prisma/client';

import { prisma } from '../../config/prisma.js';
import type {
  SessionItemInput,
  SessionListInput,
  SessionPaymentInput,
  SessionStartInput,
  SessionSubmitInput,
  SessionVerifyInput
} from './session.schema.js';

const generateSecurityCode = () => {
  const buffer = randomBytes(3).toString('hex').toUpperCase();
  return buffer.slice(0, 6);
};

type SessionTotals = {
  subtotal: number;
  tax: number;
  total: number;
};

export const startSelfCheckoutSession = async ({
  retailerCode,
  customerPhone,
  storeType = 'KIRANA',
  context
}: SessionStartInput) => {
  const retailer = await prisma.retailer.findFirst({
    where: {
      status: 'ACTIVE',
      OR: [
        { id: retailerCode },
        { contactEmail: retailerCode },
        { shopName: { equals: retailerCode, mode: 'insensitive' } }
      ]
    }
  });

  if (!retailer) {
    const error = new Error('Retailer not found or inactive');
    error.name = 'NotFoundError';
    throw error;
  }

  if (storeType === 'TRAIN' && (!context || typeof context.trainNumber !== 'string' || context.trainNumber.trim() === '')) {
    const error = new Error('trainNumber is required for train bookings');
    error.name = 'ValidationError';
    throw error;
  }

  return (prisma as any).selfCheckoutSession.create({
    data: {
      retailerId: retailer.id,
      customerPhone: customerPhone ?? null,
      status: 'IN_PROGRESS',
      storeType,
      securityCode: generateSecurityCode(),
      context: context ?? undefined
    },
    include: { items: true }
  });
};

export const addItemToSession = async (sessionId: string, item: SessionItemInput) => {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const session = await (tx as any).selfCheckoutSession.findUnique({
      where: { id: sessionId },
      include: { items: true }
    });

    if (!session) {
      const error = new Error('Session not found');
      error.name = 'NotFoundError';
      throw error;
    }

    if (session.status !== 'IN_PROGRESS') {
      const error = new Error('Cannot modify a completed session');
      error.name = 'InvalidSessionState';
      throw error;
    }

    let price = item.price;
    let name = item.name;

    const inventoryItem = await tx.inventoryItem.findFirst({
      where: {
        retailerId: session.retailerId,
        sku: item.sku
      }
    });

    if (inventoryItem) {
      price = inventoryItem.price;
      name = inventoryItem.name;
    }

    await (tx as any).selfCheckoutItem.create({
      data: {
        sessionId,
        inventoryItemId: inventoryItem?.id,
        sku: item.sku,
        name,
        quantity: item.quantity,
        price,
        taxPercentage: item.taxPercentage
      }
    });

    const items = await (tx as any).selfCheckoutItem.findMany({ where: { sessionId } });
    const totals = calculateTotals(
      items as Array<{ price: number; quantity: number; taxPercentage: number }>
    );
    totals.total = totals.subtotal + totals.tax;

    const updatedSession = await (tx as any).selfCheckoutSession.update({
      where: { id: sessionId },
      data: { totalAmount: totals.total },
      include: { items: true }
    });

    return updatedSession;
  });
};

export const removeItemFromSession = (sessionId: string, itemId: string) =>
  prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const session = await (tx as any).selfCheckoutSession.findUnique({
      where: { id: sessionId },
      include: { items: true, retailer: { select: { shopName: true } }, invoice: { include: { items: true } } }
    });

    if (!session) {
      const error = new Error('Session not found');
      error.name = 'NotFoundError';
      throw error;
    }

    if (session.status !== 'IN_PROGRESS') {
      const error = new Error('Cannot modify a completed session');
      error.name = 'InvalidSessionState';
      throw error;
    }

    const targetItem = session.items.find((item: any) => item.id === itemId);
    if (!targetItem) {
      const error = new Error('Item not found in this session');
      error.name = 'NotFoundError';
      throw error;
    }

    await (tx as any).selfCheckoutItem.delete({ where: { id: itemId } });

    const remainingItems = await (tx as any).selfCheckoutItem.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' }
    });

    const totals = calculateTotals(
      remainingItems as Array<{ price: number; quantity: number; taxPercentage: number }>
    );
    totals.total = totals.subtotal + totals.tax;

    return (tx as any).selfCheckoutSession.update({
      where: { id: sessionId },
      data: {
        totalAmount: totals.total
      },
      include: { items: true, retailer: { select: { shopName: true } }, invoice: { include: { items: true } } }
    });
  });

export const getSession = (sessionId: string) =>
  (prisma as any).selfCheckoutSession.findUnique({
    where: { id: sessionId },
    include: { items: true, retailer: { select: { shopName: true } }, invoice: { include: { items: true } } }
  });

export const submitSession = async (sessionId: string, _payload: SessionSubmitInput) => {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const session = await (tx as any).selfCheckoutSession.findUnique({
      where: { id: sessionId },
      include: { items: true, retailer: { select: { shopName: true } }, invoice: true }
    });

    if (!session) {
      const error = new Error('Session not found');
      error.name = 'NotFoundError';
      throw error;
    }

    if (session.status !== 'IN_PROGRESS') {
      const error = new Error('Session already submitted');
      error.name = 'InvalidSessionState';
      throw error;
    }

    return (tx as any).selfCheckoutSession.update({
      where: { id: sessionId },
      data: { status: 'SUBMITTED' },
      include: { items: true, retailer: { select: { shopName: true } }, invoice: { include: { items: true } } }
    });
  });
};

export const verifySession = (sessionId: string, payload: SessionVerifyInput) =>
  prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const session = await (tx as any).selfCheckoutSession.findUnique({
      where: { id: sessionId },
      include: { items: true, retailer: { select: { shopName: true } }, invoice: { include: { items: true } } }
    });

    if (!session) {
      const error = new Error('Session not found');
      error.name = 'NotFoundError';
      throw error;
    }

    if (session.status !== 'PAID') {
      const error = new Error('Session must be marked as paid before approval');
      error.name = 'InvalidSessionState';
      throw error;
    }

    return (tx as any).selfCheckoutSession.update({
      where: { id: sessionId },
      data: {
        status: 'APPROVED',
        securityVerifiedAt: new Date(),
        notes: payload.guardId ? `Verified by ${payload.guardId}` : session.notes
      },
      include: { items: true, retailer: { select: { shopName: true } }, invoice: { include: { items: true } } }
    });
  });

export const listSelfCheckoutSessions = async (filters: SessionListInput, retailerId?: string) => {
  const where: Record<string, unknown> = {};

  if (filters.status) {
    where.status = filters.status;
  }

  const resolvedRetailerId = retailerId ?? filters.retailerId;
  if (resolvedRetailerId) {
    where.retailerId = resolvedRetailerId;
  }

  if (filters.storeType) {
    where.storeType = filters.storeType;
  }

  return (prisma as any).selfCheckoutSession.findMany({
    where,
    include: {
      items: true,
      retailer: { select: { shopName: true } },
      invoice: { include: { items: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
};

const calculateTotals = (items: Array<{ price: number; quantity: number; taxPercentage: number }>) => {
  return items.reduce<SessionTotals>(
    (acc, item) => {
      const lineSubtotal = item.price * item.quantity;
      const lineTax = (lineSubtotal * item.taxPercentage) / 100;
      acc.subtotal += lineSubtotal;
      acc.tax += lineTax;
      return acc;
    },
    { subtotal: 0, tax: 0, total: 0 }
  );
};

export const markSessionPaid = async (
  sessionId: string,
  payload: SessionPaymentInput & { retailerId?: string }
) => {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const session = await (tx as any).selfCheckoutSession.findUnique({
      where: { id: sessionId },
      include: {
        items: true,
        retailer: { select: { id: true, shopName: true } },
        invoice: true
      }
    });

    if (!session) {
      const error = new Error('Session not found');
      error.name = 'NotFoundError';
      throw error;
    }

    if (session.status !== 'SUBMITTED') {
      const error = new Error('Session must be submitted before marking payment');
      error.name = 'InvalidSessionState';
      throw error;
    }

    if (session.invoice) {
      const error = new Error('Payment already recorded for this session');
      error.name = 'InvalidSessionState';
      throw error;
    }

    if (payload.retailerId && session.retailerId !== payload.retailerId) {
      const error = new Error('You are not authorized to update this session');
      error.name = 'ForbiddenError';
      throw error;
    }

    if (session.items.length === 0) {
      const error = new Error('Cannot create invoice without items');
      error.name = 'InvalidSessionState';
      throw error;
    }

    const invoiceItems = session.items.map((item: any) => ({
      sku: item.sku,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      taxPercentage: item.taxPercentage
    }));

    const totals = calculateTotals(invoiceItems);
    totals.total = totals.subtotal + totals.tax;

    const invoice = await tx.invoice.create({
      data: {
        retailerId: session.retailerId,
        paymentMode: payload.paymentMode ?? 'UPI',
        customerPhone: session.customerPhone ?? null,
        notes: payload.notes ?? `Self-checkout session ${session.securityCode}`,
        subtotalAmount: totals.subtotal,
        taxAmount: totals.tax,
        totalAmount: totals.total,
        selfCheckoutSessionId: session.id,
        items: {
          create: invoiceItems
        }
      },
      include: { items: true }
    });

    const updatedSession = await (tx as any).selfCheckoutSession.update({
      where: { id: sessionId },
      data: {
        status: 'PAID',
        totalAmount: totals.total
      },
      include: {
        items: true,
        retailer: { select: { shopName: true } },
        invoice: { include: { items: true } }
      }
    });

    return { session: updatedSession, invoice };
  });
};
