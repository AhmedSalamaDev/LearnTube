import jwt from 'jsonwebtoken';
import { AUTH_TOKEN_TTL } from './auth.contracts.ts';

const ACCESS_JWT_SECRET =
  process.env.ACCESS_JWT_SECRET || process.env.JWT_SECRET || '';

if (!ACCESS_JWT_SECRET) {
  throw new Error('ACCESS_JWT_SECRET or JWT_SECRET must be set');
}

export interface JwtPayload {
  userId: string;
  email: string;
}

export interface AccessTokenPayload extends JwtPayload {
  tokenType: 'access';
}

export function generateAccessToken(payload: JwtPayload): string {
  const tokenPayload: AccessTokenPayload = {
    ...payload,
    tokenType: 'access',
  };

  return jwt.sign(tokenPayload, ACCESS_JWT_SECRET, {
    expiresIn: AUTH_TOKEN_TTL.accessTokenSeconds,
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const payload = jwt.verify(token, ACCESS_JWT_SECRET) as AccessTokenPayload;

    if (payload.tokenType !== 'access') {
      throw new Error('Invalid token type');
    }

    return payload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

// Backward-compatible aliases to avoid breaking existing auth flow while migrating.
export function generateJwt(payload: JwtPayload): string {
  return generateAccessToken(payload);
}

export function verifyJwt(token: string): JwtPayload {
  const payload = verifyAccessToken(token);
  return { userId: payload.userId, email: payload.email };
}
