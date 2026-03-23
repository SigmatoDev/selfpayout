import type { Response } from 'express';

import { asyncHandler } from '../../lib/asyncHandler.js';
import type { AuthenticatedRequest } from '../../middleware/auth.js';
import {
  restaurantAiDraftSchema,
  restaurantAiImageRequestSchema,
  restaurantAiRecipeDraftRequestSchema,
  restaurantAiRecipeDraftSchema,
  restaurantAiSetupRequestSchema,
  restaurantMenuParamsSchema
} from './restaurant.schema.js';
import {
  applyRestaurantRecipeDraft,
  applyRestaurantSetupDraft,
  generateRestaurantRecipeDraft,
  generateRestaurantMenuItemImage,
  generateRestaurantSetupDraft
} from './restaurant-ai.service.js';

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
    const error = new Error('Restaurant AI setup is only available for restaurant retailers');
    error.name = 'ForbiddenError';
    throw error;
  }
};

export const generateRestaurantSetupDraftHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const params = restaurantMenuParamsSchema.parse({ retailerId: req.params.id });
  ensureRetailerRouteAccess(req, params.retailerId);
  const payload = restaurantAiSetupRequestSchema.parse(req.body);
  const draft = await generateRestaurantSetupDraft(payload);
  res.json({ data: draft });
});

export const applyRestaurantSetupDraftHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const params = restaurantMenuParamsSchema.parse({ retailerId: req.params.id });
  ensureRetailerRouteAccess(req, params.retailerId);
  const payload = restaurantAiDraftSchema.parse(req.body);
  const result = await applyRestaurantSetupDraft(params.retailerId, payload);
  res.json({ data: result });
});

export const generateRestaurantRecipeDraftHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const params = restaurantMenuParamsSchema.parse({ retailerId: req.params.id });
  ensureRetailerRouteAccess(req, params.retailerId);
  const payload = restaurantAiRecipeDraftRequestSchema.parse(req.body ?? {});
  const draft = await generateRestaurantRecipeDraft(params.retailerId, payload);
  res.json({ data: draft });
});

export const applyRestaurantRecipeDraftHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const params = restaurantMenuParamsSchema.parse({ retailerId: req.params.id });
  ensureRetailerRouteAccess(req, params.retailerId);
  const payload = restaurantAiRecipeDraftSchema.parse(req.body);
  const result = await applyRestaurantRecipeDraft(params.retailerId, payload);
  res.json({ data: result });
});

export const generateRestaurantMenuItemImageHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const params = restaurantMenuParamsSchema.parse({ retailerId: req.params.id });
  ensureRetailerRouteAccess(req, params.retailerId);
  const payload = restaurantAiImageRequestSchema.parse(req.body);
  const image = await generateRestaurantMenuItemImage(params.retailerId, payload);
  res.status(201).json({ data: image });
});
