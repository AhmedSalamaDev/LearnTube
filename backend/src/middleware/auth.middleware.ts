import type { Response, NextFunction } from 'express';
import { verifyJwt } from '../utils/auth.utils.ts';
import type { RequestWithUser } from '../utils/types.ts';
import { db } from '../db/index.ts';
import { users } from '../db/schema.ts';
import { eq } from 'drizzle-orm';

export async function requireAuth(
  req: RequestWithUser,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.substring(7);
    const payload = verifyJwt(token);

    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    const user = result[0];

    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      error: 'Invalid or expired token',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export function requireVerifiedEmail(
  req: RequestWithUser,
  res: Response,
  next: NextFunction,
): void {
  requireAuth(req, res, (err?: any) => {
    if (err) {
      return next(err);
    }

    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (!req.user.emailVerified) {
      res
        .status(403)
        .json({ error: 'Email not verified', code: 'EMAIL_NOT_VERIFIED' });
      return;
    }

    next();
  });
}
