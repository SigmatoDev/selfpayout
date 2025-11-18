import { z } from 'zod';

export const inventoryItemSchema = z.object({
  retailerId: z.string().uuid(),
  sku: z.string().min(2),
  name: z.string().min(2),
  price: z.number().nonnegative(),
  mrp: z.number().nonnegative().optional(),
  taxPercentage: z.number().min(0).max(28).default(0),
  stockQuantity: z.number().int().nonnegative().default(0),
  unit: z.string().default('pcs'),
  barcode: z.string().optional(),
  category: z.string().optional()
});

export const inventoryBulkUploadSchema = z.object({
  retailerId: z.string().uuid(),
  items: z.array(inventoryItemSchema.omit({ retailerId: true }))
});

export type InventoryItemInput = z.infer<typeof inventoryItemSchema>;
