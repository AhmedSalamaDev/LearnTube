import { createHash, randomBytes } from 'node:crypto';
import { AUTH_TOKEN_TTL } from '../utils/auth.contracts.ts';

export interface TokenPair {
  rawToken: string;
  tokenHash: string;
  expiresAt: Date;
}

export function hashOpaqueToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function generateOpaqueToken(byteLength = 48): string {
  return randomBytes(byteLength).toString('base64url');
}

export function createTokenPair(expiresInSeconds: number): TokenPair {
  const rawToken = generateOpaqueToken();
  return {
    rawToken,
    tokenHash: hashOpaqueToken(rawToken),
    expiresAt: new Date(Date.now() + expiresInSeconds * 1000),
  };
}

export function createEmailVerificationToken(): TokenPair {
  return createTokenPair(AUTH_TOKEN_TTL.verificationTokenSeconds);
}

export function createPasswordResetToken(): TokenPair {
  return createTokenPair(AUTH_TOKEN_TTL.resetTokenSeconds);
}

export function isExpired(expiresAt: Date): boolean {
  return expiresAt.getTime() <= Date.now();
}
