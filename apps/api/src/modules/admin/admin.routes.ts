import { Router } from 'express';

import { authenticate } from '../../middleware/auth';
import { platformMetricsHandler } from './admin.controller';

export const adminRouter = Router();

adminRouter.use(authenticate(['SUPER_ADMIN']));
adminRouter.get('/metrics', platformMetricsHandler);
