import type { Response } from 'express';

import { asyncHandler } from '../../lib/asyncHandler.js';
import type { AuthenticatedRequest } from '../../middleware/auth.js';
import { inventoryBulkUploadSchema, inventoryItemSchema } from './inventory.schema.js';
import { bulkUpload, listInventory, upsertItem } from './inventory.service.js';

export const listInventoryHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const retailerId = req.user?.retailerId ?? (req.query.retailerId as string);
  if (!retailerId) {
    return res.status(400).json({ message: 'retailerId required' });
  }
  const search = typeof req.query.search === 'string' ? req.query.search : undefined;
  const items = await listInventory(retailerId, search);
  res.json({ data: items });
});

export const upsertItemHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const baseRetailer = req.user?.retailerId;
  const payload = inventoryItemSchema.parse({ ...req.body, retailerId: req.body.retailerId ?? baseRetailer });
  const item = await upsertItem(payload);
  res.json({ data: item });
});

export const bulkUploadHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const payload = inventoryBulkUploadSchema.parse(req.body);
  await bulkUpload(payload.retailerId, payload.items);
  res.status(202).json({ message: 'Inventory processing', count: payload.items.length });
});
