import type { Response } from 'express';

import { asyncHandler } from '../../lib/asyncHandler.js';
import type { AuthenticatedRequest } from '../../middleware/auth.js';
import { subscriptionAssignSchema, subscriptionPlanSchema } from './subscription.schema.js';
import { assignPlan, createPlan, listPlans, updatePlan } from './subscription.service.js';

export const listPlansHandler = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  const plans = await listPlans();
  res.json({ data: plans });
});

export const createPlanHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const payload = subscriptionPlanSchema.parse(req.body);
  const plan = await createPlan(payload);
  res.status(201).json({ data: plan });
});

export const updatePlanHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const payload = subscriptionPlanSchema.parse(req.body);
  const plan = await updatePlan(req.params.id, payload);
  res.json({ data: plan });
});

export const assignPlanHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const payload = subscriptionAssignSchema.parse(req.body);
  const subscription = await assignPlan(payload);
  res.json({ data: subscription });
});
