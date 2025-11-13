import { Router } from 'express';

import { authenticate } from '../../middleware/auth';
import { createInvoiceHandler, listInvoicesHandler } from './receipt.controller';

export const receiptRouter = Router();

receiptRouter.use(authenticate(['RETAILER_ADMIN', 'RETAILER_STAFF', 'SUPER_ADMIN']));
receiptRouter.get('/', listInvoicesHandler);
receiptRouter.post('/', createInvoiceHandler);
