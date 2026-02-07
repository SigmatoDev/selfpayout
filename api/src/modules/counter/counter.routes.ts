import { Router, type Router as ExpressRouter } from 'express';

import { authenticate } from '../../middleware/auth.js';
import {
  createCounterOrderHandler,
  getCounterOrderHandler,
  listCounterOrdersHandler,
  updateCounterOrderStatusHandler
} from './counter.controller.js';

export const counterRouter: ExpressRouter = Router();

counterRouter.use(authenticate(['RETAILER_ADMIN', 'RETAILER_STAFF', 'SUPER_ADMIN']));
counterRouter.post('/orders', createCounterOrderHandler);
counterRouter.get('/orders', listCounterOrdersHandler);
counterRouter.get('/orders/:orderId', getCounterOrderHandler);
counterRouter.patch('/orders/:orderId/status', updateCounterOrderStatusHandler);
