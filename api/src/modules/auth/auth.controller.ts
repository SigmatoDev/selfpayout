import type { Response } from 'express';

import { asyncHandler } from '../../lib/asyncHandler';
import { loginSchema } from './auth.schema';
import { login } from './auth.service';
import type { AuthenticatedRequest } from '../../middleware/auth';

export const loginHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const payload = loginSchema.parse(req.body);
  const result = await login(payload);
  res.json(result);
});

export const currentUserHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  res.json({ user: req.user });
});
