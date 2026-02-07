import { prisma } from '../../config/prisma.js';
import type { TicketEventInput, TicketOrderInput } from './ticketing.schema.js';

const ensureRetailerAccess = (retailerId: string, actorRetailerId?: string, isAdmin?: boolean) => {
  if (!isAdmin && actorRetailerId && actorRetailerId !== retailerId) {
    const error = new Error('Insufficient permissions for retailer');
    error.name = 'ForbiddenError';
    throw error;
  }
};

export const listPublicEvents = async (query: { retailerId?: string; search?: string }) => {
  const term = query.search?.trim();
  return prisma.ticketEvent.findMany({
    where: {
      status: 'ACTIVE',
      retailerId: query.retailerId,
      ...(term
        ? {
            OR: [
              { title: { contains: term, mode: 'insensitive' } },
              { venue: { contains: term, mode: 'insensitive' } },
              { location: { contains: term, mode: 'insensitive' } }
            ]
          }
        : {})
    },
    include: { tiers: { orderBy: { sortOrder: 'asc' } } },
    orderBy: { createdAt: 'desc' }
  });
};

export const getEventById = async (eventId: string) => {
  const event = await prisma.ticketEvent.findUnique({
    where: { id: eventId },
    include: { tiers: { orderBy: { sortOrder: 'asc' } } }
  });
  if (!event) {
    const error = new Error('Event not found');
    error.name = 'NotFoundError';
    throw error;
  }
  return event;
};

export const listRetailerEvents = async (retailerId: string) => {
  return prisma.ticketEvent.findMany({
    where: { retailerId },
    include: { tiers: { orderBy: { sortOrder: 'asc' } } },
    orderBy: { createdAt: 'desc' }
  });
};

export const createTicketEvent = async (retailerId: string, payload: TicketEventInput) => {
  const retailer = await prisma.retailer.findUnique({ where: { id: retailerId } });
  if (!retailer) {
    const error = new Error('Retailer not found');
    error.name = 'NotFoundError';
    throw error;
  }

  const tiers = payload.tiers ?? [];
  const ticketsLeft = payload.ticketsLeft ?? tiers.reduce((sum, tier) => sum + tier.available, 0);
  const price =
    payload.price ??
    (tiers.length ? tiers.map((tier) => tier.price).reduce((a, b) => (a < b ? a : b)) : 0);

  return prisma.ticketEvent.create({
    data: {
      retailerId,
      title: payload.title,
      venue: payload.venue,
      dateLabel: payload.dateLabel,
      price,
      owner: payload.owner ?? retailer.shopName,
      imageUrl: payload.imageUrl,
      gallery: payload.gallery ?? [],
      location: payload.location,
      attractions: payload.attractions ?? [],
      ticketsLeft,
      status: payload.status ?? 'ACTIVE',
      sellerName: payload.sellerName ?? retailer.shopName,
      sellerRating: payload.sellerRating ?? 4.5,
      tiers: {
        create: tiers.map((tier, index) => ({
          label: tier.label,
          price: tier.price,
          mrp: tier.mrp,
          available: tier.available,
          sortOrder: index
        }))
      }
    },
    include: { tiers: { orderBy: { sortOrder: 'asc' } } }
  });
};

export const updateTicketEvent = async (retailerId: string, eventId: string, payload: TicketEventInput) => {
  const existing = await prisma.ticketEvent.findFirst({ where: { id: eventId, retailerId } });
  if (!existing) {
    const error = new Error('Event not found');
    error.name = 'NotFoundError';
    throw error;
  }

  const tiers = payload.tiers ?? [];
  const ticketsLeft = payload.ticketsLeft ?? tiers.reduce((sum, tier) => sum + tier.available, 0);
  const price =
    payload.price ??
    (tiers.length ? tiers.map((tier) => tier.price).reduce((a, b) => (a < b ? a : b)) : existing.price);

  return prisma.$transaction(async (tx) => {
    await tx.ticketTier.deleteMany({ where: { eventId } });
    return tx.ticketEvent.update({
      where: { id: eventId },
      data: {
        title: payload.title,
        venue: payload.venue,
        dateLabel: payload.dateLabel,
        price,
        owner: payload.owner ?? existing.owner,
        imageUrl: payload.imageUrl,
        gallery: payload.gallery ?? [],
        location: payload.location,
        attractions: payload.attractions ?? [],
        ticketsLeft,
        status: payload.status ?? existing.status,
        sellerName: payload.sellerName ?? existing.sellerName,
        sellerRating: payload.sellerRating ?? existing.sellerRating,
        tiers: {
          create: tiers.map((tier, index) => ({
            label: tier.label,
            price: tier.price,
            mrp: tier.mrp,
            available: tier.available,
            sortOrder: index
          }))
        }
      },
      include: { tiers: { orderBy: { sortOrder: 'asc' } } }
    });
  });
};

export const deleteTicketEvent = async (retailerId: string, eventId: string) => {
  const existing = await prisma.ticketEvent.findFirst({ where: { id: eventId, retailerId } });
  if (!existing) {
    const error = new Error('Event not found');
    error.name = 'NotFoundError';
    throw error;
  }

  await prisma.ticketEvent.delete({ where: { id: eventId } });
};

export const listTicketOrdersForRetailer = async (retailerId: string) => {
  return prisma.ticketOrder.findMany({
    where: { retailerId },
    include: { event: true, items: { include: { tier: true } } },
    orderBy: { createdAt: 'desc' }
  });
};

export const getTicketOrderForRetailer = async (retailerId: string, orderId: string) => {
  const order = await prisma.ticketOrder.findFirst({
    where: { id: orderId, retailerId },
    include: { event: true, items: { include: { tier: true } } }
  });
  if (!order) {
    const error = new Error('Order not found');
    error.name = 'NotFoundError';
    throw error;
  }
  return order;
};

export const listTicketOrdersForConsumer = async (consumerId: string) => {
  return prisma.ticketOrder.findMany({
    where: { consumerId },
    include: { event: true, items: { include: { tier: true } } },
    orderBy: { createdAt: 'desc' }
  });
};

export const getTicketOrderForConsumer = async (consumerId: string, orderId: string) => {
  const order = await prisma.ticketOrder.findFirst({
    where: { id: orderId, consumerId },
    include: { event: true, items: { include: { tier: true } } }
  });
  if (!order) {
    const error = new Error('Order not found');
    error.name = 'NotFoundError';
    throw error;
  }
  return order;
};

export const updateTicketOrderStatus = async (retailerId: string, orderId: string, status: string) => {
  const order = await prisma.ticketOrder.findFirst({
    where: { id: orderId, retailerId }
  });
  if (!order) {
    const error = new Error('Order not found');
    error.name = 'NotFoundError';
    throw error;
  }
  return prisma.ticketOrder.update({
    where: { id: orderId },
    data: { status }
  });
};

export const createTicketOrder = async (consumerId: string | undefined, payload: TicketOrderInput) => {
  const event = await prisma.ticketEvent.findUnique({
    where: { id: payload.eventId },
    include: { tiers: true }
  });
  if (!event) {
    const error = new Error('Event not found');
    error.name = 'NotFoundError';
    throw error;
  }

  const tierMap = new Map(event.tiers.map((tier) => [tier.id, tier]));
  let ticketsCount = 0;
  let totalAmount = 0;

  for (const item of payload.tiers) {
    const tier = tierMap.get(item.tierId);
    if (!tier) {
      const error = new Error('Ticket tier not found');
      error.name = 'NotFoundError';
      throw error;
    }
    if (tier.available < item.quantity) {
      const error = new Error(`Not enough tickets left for ${tier.label}`);
      error.name = 'ValidationError';
      throw error;
    }
    ticketsCount += item.quantity;
    totalAmount += tier.price * item.quantity;
  }

  const consumer = consumerId
    ? await prisma.consumer.findUnique({ where: { id: consumerId } })
    : null;

  return prisma.$transaction(async (tx) => {
    for (const item of payload.tiers) {
      await tx.ticketTier.update({
        where: { id: item.tierId },
        data: { available: { decrement: item.quantity } }
      });
    }

    await tx.ticketEvent.update({
      where: { id: event.id },
      data: { ticketsLeft: { decrement: ticketsCount } }
    });

    const order = await tx.ticketOrder.create({
      data: {
        retailerId: event.retailerId,
        eventId: event.id,
        consumerId: consumer?.id ?? null,
        buyerName: payload.buyerName ?? consumer?.name ?? 'Customer',
        buyerPhone: payload.buyerPhone,
        status: 'PAID',
        totalAmount,
        ticketsCount,
        items: {
          create: payload.tiers.map((item) => {
            const tier = tierMap.get(item.tierId)!;
            return {
              tierId: tier.id,
              label: tier.label,
              price: tier.price,
              quantity: item.quantity
            };
          })
        }
      },
      include: { event: true, items: { include: { tier: true } } }
    });

    return order;
  });
};

export const listAllTicketEvents = async () => {
  return prisma.ticketEvent.findMany({
    include: { tiers: { orderBy: { sortOrder: 'asc' } } },
    orderBy: { createdAt: 'desc' }
  });
};

export const listAllTicketOrders = async () => {
  return prisma.ticketOrder.findMany({
    include: { event: true, items: { include: { tier: true } } },
    orderBy: { createdAt: 'desc' }
  });
};

export const getTicketOrderById = async (orderId: string) => {
  const order = await prisma.ticketOrder.findUnique({
    where: { id: orderId },
    include: { event: true, items: { include: { tier: true } } }
  });
  if (!order) {
    const error = new Error('Order not found');
    error.name = 'NotFoundError';
    throw error;
  }
  return order;
};

export { ensureRetailerAccess };
