import { z } from 'zod';

export const counterOrderItemSchema = z.object({
  name: z.string().min(1),
  sku: z.string().optional(),
  price: z.number().nonnegative(),
  quantity: z.number().int().positive()
});

export const counterOrderCreateSchema = z.object({
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  paymentMode: z.enum(['CASH', 'UPI', 'CARD']).optional(),
  items: z.array(counterOrderItemSchema).min(1)
});

export const counterOrderStatusSchema = z.object({
  status: z.enum(['CREATED', 'PAID', 'CANCELLED'])
});

export const counterOrderIdSchema = z.object({
  orderId: z.string().uuid()
});

export type CounterOrderInput = z.infer<typeof counterOrderCreateSchema>;
