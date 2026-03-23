import type { Response } from 'express';

import { asyncHandler } from '../../lib/asyncHandler.js';
import type { AuthenticatedRequest } from '../../middleware/auth.js';
import { restaurantMenuParamsSchema } from './restaurant.schema.js';
import {
  menuItemIdSchema,
  rawMaterialAdjustSchema,
  rawMaterialIdSchema,
  rawMaterialUpsertSchema,
  recipeReplaceSchema,
  stockSummaryQuerySchema
} from './restaurant-stock.schema.js';
import {
  adjustRawMaterialStock,
  getDailyStockSummary,
  listMenuItemRecipes,
  listRawMaterials,
  replaceMenuItemRecipe,
  upsertRawMaterial
} from './restaurant-stock.service.js';

const ensureRetailerRouteAccess = (req: AuthenticatedRequest, retailerId: string) => {
  if (req.user?.role === 'SUPER_ADMIN') {
    return;
  }

  if (!req.user?.retailerId || req.user.retailerId !== retailerId) {
    const error = new Error('Insufficient permissions for retailer');
    error.name = 'ForbiddenError';
    throw error;
  }

  if (req.user.storeType !== 'RESTAURANT') {
    const error = new Error('Restaurant stock features are only available for restaurant retailers');
    error.name = 'ForbiddenError';
    throw error;
  }
};

export const listRawMaterialsHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const params = restaurantMenuParamsSchema.parse({ retailerId: req.params.id });
  ensureRetailerRouteAccess(req, params.retailerId);
  const materials = await listRawMaterials(params.retailerId);
  res.json({ data: materials });
});

export const upsertRawMaterialHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const params = restaurantMenuParamsSchema.parse({ retailerId: req.params.id });
  ensureRetailerRouteAccess(req, params.retailerId);
  const payload = rawMaterialUpsertSchema.parse(req.body);
  const material = await upsertRawMaterial(params.retailerId, payload);
  res.status(payload.id ? 200 : 201).json({ data: material });
});

export const adjustRawMaterialStockHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const params = restaurantMenuParamsSchema.parse({ retailerId: req.params.id });
  ensureRetailerRouteAccess(req, params.retailerId);
  const { materialId } = rawMaterialIdSchema.parse({ materialId: req.params.materialId });
  const payload = rawMaterialAdjustSchema.parse(req.body);
  const material = await adjustRawMaterialStock(params.retailerId, materialId, payload);
  res.json({ data: material });
});

export const listMenuItemRecipesHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const params = restaurantMenuParamsSchema.parse({ retailerId: req.params.id });
  ensureRetailerRouteAccess(req, params.retailerId);
  const recipes = await listMenuItemRecipes(params.retailerId);
  res.json({ data: recipes });
});

export const replaceMenuItemRecipeHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const params = restaurantMenuParamsSchema.parse({ retailerId: req.params.id });
  ensureRetailerRouteAccess(req, params.retailerId);
  const { menuItemId } = menuItemIdSchema.parse({ menuItemId: req.params.menuItemId });
  const payload = recipeReplaceSchema.parse(req.body);
  const recipe = await replaceMenuItemRecipe(params.retailerId, menuItemId, payload);
  res.json({ data: recipe });
});

export const getDailyStockSummaryHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const params = restaurantMenuParamsSchema.parse({ retailerId: req.params.id });
  ensureRetailerRouteAccess(req, params.retailerId);
  const query = stockSummaryQuerySchema.parse(req.query);
  const summary = await getDailyStockSummary(params.retailerId, query.date);
  res.json({ data: summary });
});
