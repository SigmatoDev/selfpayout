import { Router, type Router as ExpressRouter } from 'express';

import { authenticate } from '../../middleware/auth.js';
import { outstandingLedgerHandler, salesSummaryHandler } from './sales.controller.js';

export const salesRouter: ExpressRouter = Router();

salesRouter.use(authenticate(['RETAILER_ADMIN', 'RETAILER_STAFF', 'SUPER_ADMIN']));
salesRouter.get('/summary', salesSummaryHandler);
salesRouter.get('/ledger', outstandingLedgerHandler);
