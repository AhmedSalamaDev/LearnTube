import { and, eq, isNull } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { db } from '../db/index.ts';
import {
  refreshTokens,
  type RefreshToken,
  type NewRefreshToken,
} from '../db/schema.ts';
import { AUTH_TOKEN_TTL } from '../utils/auth.contracts.ts';
import {
  createTokenPair,
  hashOpaqueToken,
  isExpired,
} from './token-lifecycle.service.ts';

const TOKEN_REVOKE_REASON_ROTATED = 'ROTATED';
const TOKEN_REVOKE_REASON_REUSE_DETECTED = 'REUSE_DETECTED';

export interface RefreshTokenIssueInput {
  userId: string;
  familyId?: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface IssuedRefreshToken {
  refreshToken: string;
  record: RefreshToken;
}

export async function issueRefreshToken(
  input: RefreshTokenIssueInput,
): Promise<IssuedRefreshToken> {
  const tokenPair = createTokenPair(AUTH_TOKEN_TTL.refreshTokenSeconds);
  const familyId = input.familyId ?? randomUUID();

  const recordToInsert: NewRefreshToken = {
    userId: input.userId,
    tokenHash: tokenPair.tokenHash,
    familyId,
    expiresAt: tokenPair.expiresAt,
    userAgent: input.userAgent,
    ipAddress: input.ipAddress,
  };

  const inserted = await db
    .insert(refreshTokens)
    .values(recordToInsert)
    .returning();

  const record = inserted[0];

  if (!record) {
    throw new Error('Failed to persist refresh token');
  }

  return {
    refreshToken: tokenPair.rawToken,
    record,
  };
}

export async function findRefreshTokenByRawToken(
  rawToken: string,
): Promise<RefreshToken | undefined> {
  const tokenHash = hashOpaqueToken(rawToken);
  const result = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.tokenHash, tokenHash))
    .limit(1);

  return result[0];
}

export async function revokeRefreshToken(
  rawToken: string,
  reason: string,
): Promise<boolean> {
  const current = await findRefreshTokenByRawToken(rawToken);

  if (!current || current.revokedAt) {
    return false;
  }

  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date(), revokeReason: reason })
    .where(eq(refreshTokens.id, current.id));

  return true;
}

export async function revokeRefreshTokenFamily(
  familyId: string,
  reason: string,
): Promise<void> {
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date(), revokeReason: reason })
    .where(
      and(
        eq(refreshTokens.familyId, familyId),
        isNull(refreshTokens.revokedAt),
      ),
    );
}

export async function revokeAllUserRefreshTokens(
  userId: string,
  reason: string,
): Promise<void> {
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date(), revokeReason: reason })
    .where(
      and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)),
    );
}

export async function rotateRefreshToken(
  rawToken: string,
  metadata?: { userAgent?: string; ipAddress?: string },
): Promise<IssuedRefreshToken> {
  const current = await findRefreshTokenByRawToken(rawToken);

  if (!current) {
    throw new Error('Invalid refresh token');
  }

  if (current.revokedAt) {
    await revokeRefreshTokenFamily(
      current.familyId,
      TOKEN_REVOKE_REASON_REUSE_DETECTED,
    );
    throw new Error('Refresh token reuse detected');
  }

  if (isExpired(current.expiresAt)) {
    throw new Error('Expired refresh token');
  }

  const nextIssueInput: RefreshTokenIssueInput = {
    userId: current.userId,
    familyId: current.familyId,
  };

  if (metadata?.userAgent) {
    nextIssueInput.userAgent = metadata.userAgent;
  }

  if (metadata?.ipAddress) {
    nextIssueInput.ipAddress = metadata.ipAddress;
  }

  const issued = await issueRefreshToken(nextIssueInput);

  await db
    .update(refreshTokens)
    .set({
      revokedAt: new Date(),
      revokeReason: TOKEN_REVOKE_REASON_ROTATED,
      replacedByTokenId: issued.record.id,
    })
    .where(eq(refreshTokens.id, current.id));

  return issued;
}

export const REFRESH_TOKEN_REVOKE_REASONS = {
  ROTATED: TOKEN_REVOKE_REASON_ROTATED,
  REUSE_DETECTED: TOKEN_REVOKE_REASON_REUSE_DETECTED,
  LOGOUT: 'LOGOUT',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
} as const;
