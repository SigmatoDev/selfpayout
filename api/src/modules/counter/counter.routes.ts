import { Router, type Router as ExpressRouter } from 'express';

import { authenticate } from '../../middleware/auth.js';
import {
  appendCounterOrderItemsHandler,
  createCounterOrderHandler,
  getCounterOrderHandler,
  listCounterOrdersHandler,
  markCounterOrdersPaidByPhoneHandler,
  removeCounterOrderItemHandler,
  updateCounterOrderStatusHandler,
  updateCounterOrderItemHandler
} from './counter.controller.js';

export const counterRouter: ExpressRouter = Router();

counterRouter.use(authenticate(['RETAILER_ADMIN', 'RETAILER_STAFF', 'SUPER_ADMIN']));
counterRouter.post('/orders', createCounterOrderHandler);
counterRouter.get('/orders', listCounterOrdersHandler);
counterRouter.post('/orders/mark-payment', markCounterOrdersPaidByPhoneHandler);
counterRouter.get('/orders/:orderId', getCounterOrderHandler);
counterRouter.post('/orders/:orderId/items', appendCounterOrderItemsHandler);
counterRouter.delete('/orders/:orderId/items/:itemId', removeCounterOrderItemHandler);
counterRouter.patch('/orders/:orderId/status', updateCounterOrderStatusHandler);
counterRouter.patch('/orders/:orderId/items/:itemId', updateCounterOrderItemHandler);
