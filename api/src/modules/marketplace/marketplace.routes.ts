import { Router, type Router as ExpressRouter } from 'express';

import { authenticate } from '../../middleware/auth.js';
import {
  createMarketplaceOrderHandler,
  getConsumerMarketplaceOrderHandler,
  getRetailerMarketplaceOrderHandler,
  listConsumerMarketplaceOrdersHandler,
  listRetailerMarketplaceOrdersHandler,
  updateRetailerMarketplaceOrderStatusHandler
} from './marketplace.controller.js';

export const marketplaceRouter: ExpressRouter = Router();

// Consumer marketplace orders
marketplaceRouter.post('/orders', authenticate(['CONSUMER']), createMarketplaceOrderHandler);
marketplaceRouter.get('/orders', authenticate(['CONSUMER']), listConsumerMarketplaceOrdersHandler);
marketplaceRouter.get('/orders/:orderId', authenticate(['CONSUMER']), getConsumerMarketplaceOrderHandler);

// Retailer marketplace orders
marketplaceRouter.get(
  '/retailers/:retailerId/orders',
  authenticate(['RETAILER_ADMIN', 'RETAILER_STAFF', 'SUPER_ADMIN']),
  listRetailerMarketplaceOrdersHandler
);
marketplaceRouter.get(
  '/retailers/:retailerId/orders/:orderId',
  authenticate(['RETAILER_ADMIN', 'RETAILER_STAFF', 'SUPER_ADMIN']),
  getRetailerMarketplaceOrderHandler
);
marketplaceRouter.patch(
  '/retailers/:retailerId/orders/:orderId/status',
  authenticate(['RETAILER_ADMIN', 'RETAILER_STAFF', 'SUPER_ADMIN']),
  updateRetailerMarketplaceOrderStatusHandler
);
