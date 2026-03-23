import { z } from 'zod';

export const rawMaterialUpsertSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(80),
  unit: z.string().trim().min(1).max(20),
  currentStock: z.number().min(0).default(0),
  reorderLevel: z.number().min(0).default(0),
  costPerUnit: z.number().min(0).default(0),
  isActive: z.boolean().default(true)
});

export const rawMaterialAdjustSchema = z.object({
  type: z.enum(['PURCHASE', 'WASTAGE', 'ADJUSTMENT']),
  quantity: z.number(),
  notes: z.string().trim().max(200).optional()
});

export const rawMaterialIdSchema = z.object({
  materialId: z.string().uuid()
});

export const recipeReplaceSchema = z.object({
  items: z
    .array(
      z.object({
        rawMaterialId: z.string().uuid(),
        quantity: z.number().positive()
      })
    )
    .default([])
});

export const menuItemIdSchema = z.object({
  menuItemId: z.string().uuid()
});

export const stockSummaryQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});

export type RawMaterialUpsertInput = z.infer<typeof rawMaterialUpsertSchema>;
export type RawMaterialAdjustInput = z.infer<typeof rawMaterialAdjustSchema>;
export type RecipeReplaceInput = z.infer<typeof recipeReplaceSchema>;
