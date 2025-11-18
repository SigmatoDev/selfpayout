import { Router, type Router as ExpressRouter } from 'express';

import { authenticate } from '../../middleware/auth.js';
import { listPendingKycHandler, updateKycStatusHandler } from './kyc.controller.js';

export const kycRouter: ExpressRouter = Router();

kycRouter.use(authenticate(['SUPER_ADMIN']));
kycRouter.get('/', listPendingKycHandler);
kycRouter.post('/status', updateKycStatusHandler);
