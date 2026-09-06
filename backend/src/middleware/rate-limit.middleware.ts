import { rateLimit, type Options } from 'express-rate-limit';
import type { Request } from 'express';

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0]?.trim() || req.ip || 'unknown';
  }

  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0] || req.ip || 'unknown';
  }

  return req.ip || 'unknown';
}

const ipAndEmailKey = (req: Request): string => {
  const ip = getClientIp(req);
  const email = (req.body as Record<string, unknown> | undefined)?.email;
  const emailPart =
    typeof email === 'string' ? email.toLocaleLowerCase() : 'unknown-email';
  return `${ip}:${emailPart}`;
};

const rateLimitHandler: Options['handler'] = (_req, res, _next, options) => {
  const retryAfterSeconds = Math.ceil(options.windowMs / 1000);
  res.status(429).json({
    error: 'Too many requests',
    retryAfterSeconds,
  });
};

export const authRateLimits = {
  loginByIpAndEmail: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    handler: rateLimitHandler,
    keyGenerator: ipAndEmailKey,
  }),
  registerByIp: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    handler: rateLimitHandler,
  }),
  refreshByIp: rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 30,
    handler: rateLimitHandler,
  }),
  forgotPasswordByIpAndEmail: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    handler: rateLimitHandler,
    keyGenerator: ipAndEmailKey,
  }),
};
