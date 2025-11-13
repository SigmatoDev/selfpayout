import { Router } from 'express';

import { authenticate } from '../../middleware/auth';
import { listCustomersHandler, upsertCustomerHandler } from './customer.controller';

export const customerRouter = Router();

customerRouter.use(authenticate(['RETAILER_ADMIN', 'RETAILER_STAFF', 'SUPER_ADMIN']));
customerRouter.get('/', listCustomersHandler);
customerRouter.post('/', upsertCustomerHandler);
