import { z } from 'zod';

export const marketplaceOrderItemSchema = z.object({
  inventoryItemId: z.string().uuid(),
  quantity: z.number().int().positive()
});

export const marketplaceOrderCreateSchema = z.object({
  retailerId: z.string().min(3),
  buyerName: z.string().optional(),
  buyerPhone: z.string().min(6),
  deliveryAddress: z.string().optional(),
  items: z.array(marketplaceOrderItemSchema).min(1)
});

export const marketplaceOrderStatusSchema = z.object({
  status: z.enum(['SUBMITTED', 'ACCEPTED', 'PACKING', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
});

export const marketplaceRetailerParamsSchema = z.object({
  retailerId: z.string().min(3)
});

export const marketplaceOrderIdSchema = z.object({
  orderId: z.string().uuid()
});

export type MarketplaceOrderInput = z.infer<typeof marketplaceOrderCreateSchema>;
