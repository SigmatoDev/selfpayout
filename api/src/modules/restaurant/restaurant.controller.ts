import type { Response } from 'express';

import { asyncHandler } from '../../lib/asyncHandler.js';
import type { AuthenticatedRequest } from '../../middleware/auth.js';
import {
  kitchenTicketSchema,
  menuPayloadSchema,
  menuImageUploadSchema,
  restaurantSettingsSchema,
  restaurantMenuParamsSchema,
  tableIdSchema,
  tableGroupIdSchema,
  tableGroupSchema,
  tableListParamsSchema,
  tableUpsertSchema,
  tokenUpsertSchema
} from './restaurant.schema.js';
import {
  createKitchenTicket,
  createTableGroup,
  deleteTableGroup,
  getMenuSnapshot,
  getRestaurantSettings,
  listTables,
  listTableGroups,
  listPublicTables,
  listTokens,
  updateRestaurantSettings,
  uploadMenuImage,
  upsertMenu,
  upsertTable,
  deleteTable,
  upsertToken,
  deleteToken
} from './restaurant.service.js';

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
    const error = new Error('Restaurant features are only available for restaurant retailers');
    error.name = 'ForbiddenError';
    throw error;
  }
};

export const getMenuHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const params = restaurantMenuParamsSchema.parse({ retailerId: req.params.id });
  const menu = await getMenuSnapshot(params.retailerId);
  res.json({ data: menu });
});

export const upsertMenuHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const params = restaurantMenuParamsSchema.parse({ retailerId: req.params.id });
  ensureRetailerRouteAccess(req, params.retailerId);
  try {
    const payload = menuPayloadSchema.parse(req.body);
    const result = await upsertMenu(params.retailerId, payload);
    res.json({ data: result });
  } catch (error) {
    // Log the raw payload and error for troubleshooting validation issues
    console.error('Menu upsert failed', {
      retailerId: params.retailerId,
      payload: req.body,
      errorMessage: (error as Error)?.message,
      errorStack: (error as Error)?.stack
    });
    throw error;
  }
});

export const listTablesHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const params = tableListParamsSchema.parse({ retailerId: req.params.id });
  ensureRetailerRouteAccess(req, params.retailerId);
  const tables = await listTables(params.retailerId);
  res.json({ data: tables });
});

export const listPublicTablesHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const params = tableListParamsSchema.parse({ retailerId: req.params.id });
  const tables = await listPublicTables(params.retailerId);
  res.json({ data: tables });
});

export const upsertTableHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const params = tableListParamsSchema.parse({ retailerId: req.params.id });
  ensureRetailerRouteAccess(req, params.retailerId);
  const payload = tableUpsertSchema.parse(req.body);
  const table = await upsertTable(params.retailerId, payload);
  res.status(201).json({ data: table });
});

export const deleteTableHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const params = tableListParamsSchema.parse({ retailerId: req.params.id });
  ensureRetailerRouteAccess(req, params.retailerId);
  const { tableId } = tableIdSchema.parse({ tableId: req.params.tableId });
  await deleteTable(params.retailerId, tableId);
  res.status(204).send();
});

export const listTokensHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const params = tableListParamsSchema.parse({ retailerId: req.params.id });
  ensureRetailerRouteAccess(req, params.retailerId);
  const tokens = await listTokens(params.retailerId);
  res.json({ data: tokens });
});

export const upsertTokenHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const params = tableListParamsSchema.parse({ retailerId: req.params.id });
  ensureRetailerRouteAccess(req, params.retailerId);
  const payload = tokenUpsertSchema.parse(req.body);
  const token = await upsertToken(params.retailerId, payload.label);
  res.status(201).json({ data: token });
});

export const deleteTokenHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const params = tableListParamsSchema.parse({ retailerId: req.params.id });
  ensureRetailerRouteAccess(req, params.retailerId);
  const { tableId } = tableIdSchema.parse({ tableId: req.params.tokenId });
  await deleteToken(params.retailerId, tableId);
  res.status(204).send();
});

export const listTableGroupsHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const params = tableListParamsSchema.parse({ retailerId: req.params.id });
  ensureRetailerRouteAccess(req, params.retailerId);
  const groups = await listTableGroups(params.retailerId);
  res.json({ data: groups });
});

export const createTableGroupHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const params = tableListParamsSchema.parse({ retailerId: req.params.id });
  ensureRetailerRouteAccess(req, params.retailerId);
  const payload = tableGroupSchema.parse(req.body);
  const group = await createTableGroup(params.retailerId, payload.name);
  res.status(201).json({ data: group });
});

export const deleteTableGroupHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const params = tableListParamsSchema.parse({ retailerId: req.params.id });
  ensureRetailerRouteAccess(req, params.retailerId);
  const { groupId } = tableGroupIdSchema.parse({ groupId: req.params.groupId });
  await deleteTableGroup(params.retailerId, groupId);
  res.status(204).send();
});

export const getRestaurantSettingsHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const params = restaurantMenuParamsSchema.parse({ retailerId: req.params.id });
  ensureRetailerRouteAccess(req, params.retailerId);
  const settings = await getRestaurantSettings(params.retailerId);
  res.json({ data: settings });
});

export const updateRestaurantSettingsHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const params = restaurantMenuParamsSchema.parse({ retailerId: req.params.id });
  ensureRetailerRouteAccess(req, params.retailerId);
  const payload = restaurantSettingsSchema.parse(req.body);
  const settings = await updateRestaurantSettings(params.retailerId, payload);
  res.json({ data: settings });
});

export const uploadMenuImageHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const params = restaurantMenuParamsSchema.parse({ retailerId: req.params.id });
  ensureRetailerRouteAccess(req, params.retailerId);
  const payload = menuImageUploadSchema.parse(req.body);
  const result = await uploadMenuImage(params.retailerId, payload);
  res.status(201).json({ data: result });
});

export const createKitchenTicketHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const params = restaurantMenuParamsSchema.parse({ retailerId: req.params.id });
  ensureRetailerRouteAccess(req, params.retailerId);
  const payload = kitchenTicketSchema.parse(req.body);
  const ticket = await createKitchenTicket(params.retailerId, payload);
  res.status(201).json({ data: ticket });
});
