import { Router, type Router as ExpressRouter } from 'express';

import { authenticate } from '../../middleware/auth.js';
import {
  assignPlanHandler,
  createPlanHandler,
  listPlansHandler,
  updatePlanHandler
} from './subscription.controller.js';

export const subscriptionRouter: ExpressRouter = Router();

subscriptionRouter.use(authenticate(['SUPER_ADMIN']));
subscriptionRouter.get('/plans', listPlansHandler);
subscriptionRouter.post('/plans', createPlanHandler);
subscriptionRouter.put('/plans/:id', updatePlanHandler);
subscriptionRouter.post('/assign', assignPlanHandler);
