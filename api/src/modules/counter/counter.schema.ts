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
  tableNumber: z.string().optional(),
  paymentMode: z.enum(['CASH', 'UPI', 'CARD']).optional(),
  items: z.array(counterOrderItemSchema).min(1)
});

export const counterOrderAppendItemsSchema = z.object({
  items: z.array(counterOrderItemSchema).min(1)
});

export const counterOrderStatusSchema = z.object({
  status: z.enum(['CREATED', 'FULFILLED', 'PAID', 'CANCELLED'])
});

export const counterOrderPayByPhoneSchema = z.object({
  customerPhone: z.string().min(8),
  paymentMode: z.enum(['CASH', 'UPI', 'CARD']).optional()
});

export const counterOrderItemFulfillSchema = z.object({
  fulfilledQuantity: z.number().int().nonnegative()
});

export const counterOrderIdSchema = z.object({
  orderId: z.string().uuid()
});

export const counterOrderItemIdSchema = z.object({
  orderId: z.string().uuid(),
  itemId: z.string().uuid()
});

export type CounterOrderInput = z.infer<typeof counterOrderCreateSchema>;
export type CounterOrderAppendItemsInput = z.infer<
  typeof counterOrderAppendItemsSchema
>;
