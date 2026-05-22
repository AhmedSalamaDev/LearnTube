import type { NextFunction, Response } from 'express';
import type { RequestWithUser } from '../utils/types.ts';

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

function getClientIp(req: RequestWithUser): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0]?.trim() || req.ip || 'unknown';
  }

  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0] || req.ip || 'unknown';
  }

  return req.ip || 'unknown';
}

function createKey(req: RequestWithUser, keySuffix?: string): string {
  const ip = getClientIp(req);
  return keySuffix ? `${ip}:${keySuffix}` : ip;
}

export function rateLimit(options: {
  windowMs: number;
  max: number;
  keySuffix?: (req: RequestWithUser) => string | undefined;
}) {
  const { windowMs, max, keySuffix } = options;

  return function rateLimitMiddleware(
    req: RequestWithUser,
    res: Response,
    next: NextFunction,
  ): void {
    const suffix = keySuffix?.(req);
    const key = createKey(req, suffix);
    const now = Date.now();

    const current = buckets.get(key);
    if (!current || current.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    if (current.count >= max) {
      const retryAfterSeconds = Math.ceil((current.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds.toString());
      res.status(429).json({
        error: 'Too many requests',
        retryAfterSeconds,
      });
      return;
    }

    current.count += 1;
    buckets.set(key, current);
    next();
  };
}

export const authRateLimits = {
  loginByIpAndEmail: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    keySuffix: (req) => {
      const email = (req.body as Record<string, unknown> | undefined)?.email;
      return typeof email === 'string' ? email.toLowerCase() : 'unknown-email';
    },
  }),
  registerByIp: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
  }),
  refreshByIp: rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 30,
  }),
  forgotPasswordByIpAndEmail: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    keySuffix: (req) => {
      const email = (req.body as Record<string, unknown> | undefined)?.email;
      return typeof email === 'string' ? email.toLowerCase() : 'unknown-email';
    },
  }),
};
