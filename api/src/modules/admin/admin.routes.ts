import { Router, type Router as ExpressRouter } from 'express';

import { authenticate } from '../../middleware/auth.js';
import { platformMetricsHandler } from './admin.controller.js';

export const adminRouter: ExpressRouter = Router();

adminRouter.use(authenticate(['SUPER_ADMIN']));
adminRouter.get('/metrics', platformMetricsHandler);
