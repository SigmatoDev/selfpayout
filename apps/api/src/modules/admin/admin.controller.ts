import type { Response } from 'express';

import { asyncHandler } from '../../lib/asyncHandler';
import type { AuthenticatedRequest } from '../../middleware/auth';
import { getPlatformMetrics } from './admin.service';

export const platformMetricsHandler = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  const metrics = await getPlatformMetrics();
  res.json({ data: metrics });
});
