import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { env } from '../config/env';

export interface AuthenticatedUser {
  id: string;
  role: 'SUPER_ADMIN' | 'RETAILER_ADMIN' | 'RETAILER_STAFF';
  retailerId?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export const authenticate = (roles?: Array<AuthenticatedUser['role']>) =>
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    try {
      const token = header.replace('Bearer ', '');
      const decoded = jwt.verify(token, env.JWT_SECRET);

      if (typeof decoded !== 'object' || decoded === null || !('role' in decoded) || !('id' in decoded)) {
        return res.status(401).json({ message: 'Invalid token payload' });
      }

      const payload = decoded as AuthenticatedUser;
      req.user = payload;

      if (roles && !roles.includes(payload.role)) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }

      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Invalid token' });
    }
  };
