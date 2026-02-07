import type { Response } from 'express';

import { asyncHandler } from '../../lib/asyncHandler.js';
import type { AuthenticatedRequest } from '../../middleware/auth.js';
import {
  marketplaceOrderCreateSchema,
  marketplaceOrderIdSchema,
  marketplaceOrderStatusSchema,
  marketplaceRetailerParamsSchema
} from './marketplace.schema.js';
import {
  createMarketplaceOrder,
  getMarketplaceOrderForConsumer,
  getMarketplaceOrderForRetailer,
  listAllMarketplaceOrders,
  getMarketplaceOrderById,
  listMarketplaceOrdersForConsumer,
  listMarketplaceOrdersForRetailer,
  updateMarketplaceOrderStatus
} from './marketplace.service.js';

export const createMarketplaceOrderHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const payload = marketplaceOrderCreateSchema.parse(req.body);
  const order = await createMarketplaceOrder(req.user?.id, payload);
  res.status(201).json({ data: order });
});

export const listConsumerMarketplaceOrdersHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const orders = await listMarketplaceOrdersForConsumer(req.user!.id);
  res.json({ data: orders });
});

export const getConsumerMarketplaceOrderHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const params = marketplaceOrderIdSchema.parse(req.params);
  const order = await getMarketplaceOrderForConsumer(req.user!.id, params.orderId);
  res.json({ data: order });
});

export const listRetailerMarketplaceOrdersHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const params = marketplaceRetailerParamsSchema.parse(req.params);
  if (req.user?.role !== 'SUPER_ADMIN' && req.user?.retailerId && req.user.retailerId !== params.retailerId) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }
  const orders = await listMarketplaceOrdersForRetailer(params.retailerId);
  res.json({ data: orders });
});

export const getRetailerMarketplaceOrderHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const params = marketplaceRetailerParamsSchema.parse(req.params);
  const orderParams = marketplaceOrderIdSchema.parse(req.params);
  if (req.user?.role !== 'SUPER_ADMIN' && req.user?.retailerId && req.user.retailerId !== params.retailerId) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }
  const order = await getMarketplaceOrderForRetailer(params.retailerId, orderParams.orderId);
  res.json({ data: order });
});

export const updateRetailerMarketplaceOrderStatusHandler = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const params = marketplaceRetailerParamsSchema.parse(req.params);
    const orderParams = marketplaceOrderIdSchema.parse(req.params);
    if (req.user?.role !== 'SUPER_ADMIN' && req.user?.retailerId && req.user.retailerId !== params.retailerId) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    const payload = marketplaceOrderStatusSchema.parse(req.body);
    const order = await updateMarketplaceOrderStatus(params.retailerId, orderParams.orderId, payload.status);
    res.json({ data: order });
  }
);

export const listAdminMarketplaceOrdersHandler = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  const orders = await listAllMarketplaceOrders();
  res.json({ data: orders });
});

export const getAdminMarketplaceOrderHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const params = marketplaceOrderIdSchema.parse(req.params);
  const order = await getMarketplaceOrderById(params.orderId);
  res.json({ data: order });
});
