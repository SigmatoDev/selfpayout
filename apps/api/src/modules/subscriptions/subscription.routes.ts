import { Router } from 'express';

import { authenticate } from '../../middleware/auth';
import {
  assignPlanHandler,
  createPlanHandler,
  listPlansHandler,
  updatePlanHandler
} from './subscription.controller';

export const subscriptionRouter = Router();

subscriptionRouter.use(authenticate(['SUPER_ADMIN']));
subscriptionRouter.get('/plans', listPlansHandler);
subscriptionRouter.post('/plans', createPlanHandler);
subscriptionRouter.put('/plans/:id', updatePlanHandler);
subscriptionRouter.post('/assign', assignPlanHandler);
