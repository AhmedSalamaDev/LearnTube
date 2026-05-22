import type { NextFunction, Response } from 'express';
import type { RequestWithUser } from '../utils/types.ts';

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalizeBodyEmail(req: RequestWithUser): void {
  const body = req.body as Record<string, unknown>;
  const email = body.email;
  if (typeof email === 'string') {
    body.email = email.trim().toLowerCase();
  }
}

export function requireFields(fields: string[]) {
  return function validateRequiredFields(
    req: RequestWithUser,
    res: Response,
    next: NextFunction,
  ): void {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const missing = fields.filter((field) => !isNonEmptyString(body[field]));

    if (missing.length > 0) {
      res.status(400).json({
        error: 'Missing required fields',
        missing,
      });
      return;
    }

    next();
  };
}

export function validateEmailField(
  req: RequestWithUser,
  res: Response,
  next: NextFunction,
): void {
  normalizeBodyEmail(req);
  const body = req.body as Record<string, unknown>;
  const email = body.email;

  if (!isNonEmptyString(email)) {
    res.status(400).json({ error: 'email is required' });
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ error: 'email is invalid' });
    return;
  }

  next();
}

export function validateTokenField(fieldName = 'token') {
  return function validateToken(
    req: RequestWithUser,
    res: Response,
    next: NextFunction,
  ): void {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const token = body[fieldName];

    if (!isNonEmptyString(token)) {
      res.status(400).json({ error: `${fieldName} is required` });
      return;
    }

    if (token.length < 16) {
      res.status(400).json({ error: `${fieldName} is invalid` });
      return;
    }

    next();
  };
}

export function validateRefreshTokenField(
  req: RequestWithUser,
  res: Response,
  next: NextFunction,
): void {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const refreshToken = body.refreshToken;

  if (!isNonEmptyString(refreshToken)) {
    res.status(400).json({ error: 'refreshToken is required' });
    return;
  }

  if (refreshToken.length < 16) {
    res.status(400).json({ error: 'refreshToken is invalid' });
    return;
  }

  next();
}
