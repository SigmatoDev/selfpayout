import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

interface ApiError extends Error {
  status?: number;
  details?: unknown;
}

export const errorHandler = (err: ApiError, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ZodError) {
    return res.status(400).json({ message: 'Validation failed', issues: err.issues });
  }

  const status = err.status ?? 500;
  const payload: Record<string, unknown> = { message: err.message ?? 'Internal server error' };

  if (err.details) {
    payload.details = err.details;
  }

  if (process.env.NODE_ENV !== 'production') {
    payload.stack = err.stack;
  }

  return res.status(status).json(payload);
};
