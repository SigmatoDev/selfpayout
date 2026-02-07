import type { Response } from 'express';

import { asyncHandler } from '../../lib/asyncHandler.js';
import type { AuthenticatedRequest } from '../../middleware/auth.js';
import {
  kitchenTicketSchema,
  menuPayloadSchema,
  restaurantMenuParamsSchema,
  tableIdSchema,
  tableListParamsSchema,
  tableUpsertSchema
} from './restaurant.schema.js';
import {
  createKitchenTicket,
  getMenuSnapshot,
  listTables,
  listPublicTables,
  upsertMenu,
  upsertTable,
  deleteTable
} from './restaurant.service.js';

export const getMenuHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const params = restaurantMenuParamsSchema.parse({ retailerId: req.params.id });
  const menu = await getMenuSnapshot(params.retailerId);
  res.json({ data: menu });
});

export const upsertMenuHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const params = restaurantMenuParamsSchema.parse({ retailerId: req.params.id });
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
  const payload = tableUpsertSchema.parse(req.body);
  const table = await upsertTable(params.retailerId, payload);
  res.status(201).json({ data: table });
});

export const deleteTableHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const params = tableListParamsSchema.parse({ retailerId: req.params.id });
  const { tableId } = tableIdSchema.parse({ tableId: req.params.tableId });
  await deleteTable(params.retailerId, tableId);
  res.status(204).send();
});

export const createKitchenTicketHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const params = restaurantMenuParamsSchema.parse({ retailerId: req.params.id });
  const payload = kitchenTicketSchema.parse(req.body);
  const ticket = await createKitchenTicket(params.retailerId, payload);
  res.status(201).json({ data: ticket });
});
