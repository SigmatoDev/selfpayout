import { Router, type Router as ExpressRouter } from 'express';

import { authenticate } from '../../middleware/auth.js';
import { customerHistoryHandler, listCustomersHandler, upsertCustomerHandler } from './customer.controller.js';

export const customerRouter: ExpressRouter = Router();

customerRouter.use(authenticate(['RETAILER_ADMIN', 'RETAILER_STAFF', 'SUPER_ADMIN']));
customerRouter.get('/', listCustomersHandler);
customerRouter.get('/:id/history', customerHistoryHandler);
customerRouter.post('/', upsertCustomerHandler);
