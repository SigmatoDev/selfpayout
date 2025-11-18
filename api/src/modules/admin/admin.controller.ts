import type { Response } from 'express';

import { asyncHandler } from '../../lib/asyncHandler.js';
import type { AuthenticatedRequest } from '../../middleware/auth.js';
import { getPlatformMetrics } from './admin.service.js';

export const platformMetricsHandler = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  const metrics = await getPlatformMetrics();
  res.json({ data: metrics });
});
