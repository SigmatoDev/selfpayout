import { z } from 'zod';

export const invoiceItemSchema = z.object({
  sku: z.string(),
  name: z.string(),
  quantity: z.number().positive(),
  price: z.number().nonnegative(),
  taxPercentage: z.number().min(0).max(28).default(0)
});

export const createInvoiceSchema = z.object({
  retailerId: z.string().uuid(),
  customerPhone: z.string().min(8).optional(),
  paymentMode: z.enum(['CASH', 'UPI', 'CARD']),
  notes: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1)
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
