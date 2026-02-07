import { Router, type Router as ExpressRouter } from 'express';

import { authenticate } from '../../middleware/auth.js';
import { platformMetricsHandler } from './admin.controller.js';
import { listAdminEventsHandler, listAdminOrdersHandler, getAdminOrderHandler } from '../ticketing/ticketing.controller.js';
import { listAdminMarketplaceOrdersHandler, getAdminMarketplaceOrderHandler } from '../marketplace/marketplace.controller.js';
import { listAdminCounterOrdersHandler, getAdminCounterOrderHandler } from '../counter/counter.controller.js';

export const adminRouter: ExpressRouter = Router();

adminRouter.use(authenticate(['SUPER_ADMIN']));
adminRouter.get('/metrics', platformMetricsHandler);
adminRouter.get('/ticketing/events', listAdminEventsHandler);
adminRouter.get('/ticketing/orders', listAdminOrdersHandler);
adminRouter.get('/ticketing/orders/:orderId', getAdminOrderHandler);
adminRouter.get('/marketplace/orders', listAdminMarketplaceOrdersHandler);
adminRouter.get('/marketplace/orders/:orderId', getAdminMarketplaceOrderHandler);
adminRouter.get('/counter/orders', listAdminCounterOrdersHandler);
adminRouter.get('/counter/orders/:orderId', getAdminCounterOrderHandler);
