import type { Response } from 'express';

import { asyncHandler } from '../../lib/asyncHandler.js';
import type { AuthenticatedRequest } from '../../middleware/auth.js';
import { counterOrderCreateSchema, counterOrderIdSchema, counterOrderStatusSchema } from './counter.schema.js';
import {
  createCounterOrder,
  getCounterOrder,
  listAllCounterOrders,
  getCounterOrderById,
  listCounterOrders,
  updateCounterOrderStatus
} from './counter.service.js';

export const createCounterOrderHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const payload = counterOrderCreateSchema.parse(req.body);
  if (!req.user?.retailerId) {
    return res.status(403).json({ message: 'Retailer not linked' });
  }
  const order = await createCounterOrder(req.user.retailerId, payload);
  res.status(201).json({ data: order });
});

export const listCounterOrdersHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user?.retailerId) {
    return res.status(403).json({ message: 'Retailer not linked' });
  }
  const orders = await listCounterOrders(req.user.retailerId);
  res.json({ data: orders });
});

export const getCounterOrderHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const params = counterOrderIdSchema.parse(req.params);
  if (!req.user?.retailerId) {
    return res.status(403).json({ message: 'Retailer not linked' });
  }
  const order = await getCounterOrder(req.user.retailerId, params.orderId);
  res.json({ data: order });
});

export const updateCounterOrderStatusHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const params = counterOrderIdSchema.parse(req.params);
  const payload = counterOrderStatusSchema.parse(req.body);
  if (!req.user?.retailerId) {
    return res.status(403).json({ message: 'Retailer not linked' });
  }
  const order = await updateCounterOrderStatus(req.user.retailerId, params.orderId, payload.status);
  res.json({ data: order });
});

export const listAdminCounterOrdersHandler = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  const orders = await listAllCounterOrders();
  res.json({ data: orders });
});

export const getAdminCounterOrderHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const params = counterOrderIdSchema.parse(req.params);
  const order = await getCounterOrderById(params.orderId);
  res.json({ data: order });
});
