import { Router, type Router as ExpressRouter } from 'express';

import { authenticate } from '../../middleware/auth.js';
import { createInvoiceHandler, listInvoicesHandler } from './receipt.controller.js';

export const receiptRouter: ExpressRouter = Router();

receiptRouter.use(authenticate(['RETAILER_ADMIN', 'RETAILER_STAFF', 'SUPER_ADMIN']));
receiptRouter.get('/', listInvoicesHandler);
receiptRouter.post('/', createInvoiceHandler);
