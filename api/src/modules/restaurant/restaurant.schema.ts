import { z } from 'zod';

const addOnOptionSchema = z.object({
  id: z.string().optional(),
  label: z.string(),
  price: z.number().nonnegative().default(0),
  isDefault: z.boolean().default(false)
});

const addOnGroupSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  min: z.number().int().nonnegative().default(0),
  max: z.number().int().positive().default(1),
  options: z.array(addOnOptionSchema).default([])
});

const menuItemSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  sku: z.string().min(1),
  price: z.number().nonnegative(),
  taxPercentage: z.number().min(0).max(28).default(0),
  tags: z.array(z.string()).default([]),
  isVeg: z.boolean().nullable().optional(),
  isAvailable: z.boolean().default(true),
  addOnGroups: z.array(addOnGroupSchema).default([])
});

const menuCategorySchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
  items: z.array(menuItemSchema)
});

export const menuPayloadSchema = z.object({
  categories: z.array(menuCategorySchema)
});

export const restaurantMenuParamsSchema = z.object({
  retailerId: z.string().min(3)
});

export const tableListParamsSchema = z.object({
  retailerId: z.string().min(3)
});

export const tableUpsertSchema = z.object({
  label: z.string().min(1),
  capacity: z.number().int().positive().max(20),
  status: z.string().optional()
});

export const tableIdSchema = z.object({
  tableId: z.string().uuid()
});

export const kitchenTicketSchema = z.object({
  sessionId: z.string().uuid(),
  notes: z.string().optional()
});

export type MenuPayloadInput = z.infer<typeof menuPayloadSchema>;
