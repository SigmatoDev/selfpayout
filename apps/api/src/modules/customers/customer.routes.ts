import { Router, type Router as ExpressRouter } from 'express';

import { authenticate } from '../../middleware/auth';
import { listCustomersHandler, upsertCustomerHandler } from './customer.controller';

export const customerRouter: ExpressRouter = Router();

customerRouter.use(authenticate(['RETAILER_ADMIN', 'RETAILER_STAFF', 'SUPER_ADMIN']));
customerRouter.get('/', listCustomersHandler);
customerRouter.post('/', upsertCustomerHandler);
