import type { Response } from 'express';

import { prisma } from '../../config/prisma.js';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { loginSchema, otpLoginSchema } from './auth.schema.js';
import { login, loginWithOtp } from './auth.service.js';
import type { AuthenticatedRequest } from '../../middleware/auth.js';

export const loginHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const payload = loginSchema.parse(req.body);
  const result = await login(payload);
  res.json(result);
});

export const loginWithOtpHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const payload = otpLoginSchema.parse(req.body);
  const result = await loginWithOtp(payload);
  res.json(result);
});

export const currentUserHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const actor = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: {
      retailer: {
        select: {
          id: true,
          storeType: true,
          settings: {
            select: {
              selfBillingEnabled: true,
              marketplaceEnabled: true,
              tableOrderingEnabled: true,
              deliveryOrderingEnabled: true,
              tokenOrderingEnabled: true,
              ticketingEnabled: true
            }
          }
        }
      }
    }
  });

  if (!actor) {
    return res.status(404).json({ message: 'User not found' });
  }

  res.json({
    data: {
      id: actor.id,
      name: actor.name,
      retailerId: actor.retailerId,
      storeType: actor.retailer?.storeType,
      settings: actor.retailer?.settings ?? null
    }
  });
});
