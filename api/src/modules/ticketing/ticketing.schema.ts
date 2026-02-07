import { z } from 'zod';

export const ticketTierSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1),
  price: z.number().nonnegative(),
  mrp: z.number().nonnegative(),
  available: z.number().int().nonnegative()
});

export const ticketEventSchema = z.object({
  title: z.string().min(2),
  venue: z.string().min(2),
  dateLabel: z.string().min(2),
  price: z.number().nonnegative().optional(),
  owner: z.string().min(2).optional(),
  imageUrl: z.string().url(),
  gallery: z.array(z.string().url()).default([]),
  location: z.string().min(2),
  attractions: z.array(z.string()).default([]),
  ticketsLeft: z.number().int().nonnegative().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional(),
  sellerName: z.string().min(2).optional(),
  sellerRating: z.number().min(0).max(5).optional(),
  tiers: z.array(ticketTierSchema).default([])
});

export const ticketEventParamsSchema = z.object({
  retailerId: z.string().min(3)
});

export const ticketEventIdSchema = z.object({
  eventId: z.string().uuid()
});

export const ticketEventQuerySchema = z.object({
  retailerId: z.string().optional(),
  search: z.string().optional()
});

export const ticketOrderCreateSchema = z.object({
  eventId: z.string().uuid(),
  buyerName: z.string().min(1).optional(),
  buyerPhone: z.string().min(6),
  tiers: z.array(
    z.object({
      tierId: z.string().uuid(),
      quantity: z.number().int().positive()
    })
  )
});

export const ticketOrderStatusSchema = z.object({
  status: z.enum(['RESERVED', 'PAID', 'CANCELLED', 'REFUNDED'])
});

export const ticketOrderIdSchema = z.object({
  orderId: z.string().uuid()
});

export type TicketEventInput = z.infer<typeof ticketEventSchema>;
export type TicketOrderInput = z.infer<typeof ticketOrderCreateSchema>;
