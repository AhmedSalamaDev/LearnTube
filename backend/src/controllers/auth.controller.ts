import type { Response } from 'express';
import type { RequestWithUser } from '../utils/types.ts';
import {
  attachLocalCredentialsToUser,
  createLocalUser,
  findOrCreateUser,
  findUserByEmail,
  findUserById,
  findUserByPasswordResetTokenHash,
  findUserByVerificationTokenHash,
  incrementLoginAttempts,
  markEmailAsVerified,
  resetLoginAttempts,
  setAccountLockout,
  setPasswordResetToken,
  updatePasswordAndClearResetToken,
} from '../services/user.service.ts';
import {
  REFRESH_TOKEN_REVOKE_REASONS,
  issueRefreshToken,
  revokeAllUserRefreshTokens,
  revokeRefreshToken,
  rotateRefreshToken,
} from '../services/refresh-token.service.ts';
import {
  createEmailVerificationToken,
  createPasswordResetToken,
  hashOpaqueToken,
  isExpired,
} from '../services/token-lifecycle.service.ts';
import {
  hashPassword,
  validatePasswordStrength,
  verifyPassword,
} from '../services/password.service.ts';
import { AUTH_TOKEN_TTL } from '../utils/auth.contracts.ts';
import { generateAccessToken, generateJwt } from '../utils/auth.utils.ts';

const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCKOUT_MINUTES = 15;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function toAuthUser(user: NonNullable<RequestWithUser['user']>) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl ?? null,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
  };
}

function readRequestMeta(req: RequestWithUser): {
  userAgent?: string;
  ipAddress?: string;
} {
  const userAgentHeader = req.headers['user-agent'];
  const forwarded = req.headers['x-forwarded-for'];
  const forwardedIp =
    typeof forwarded === 'string'
      ? forwarded.split(',')[0]?.trim()
      : Array.isArray(forwarded)
        ? forwarded[0]
        : undefined;

  const result: { userAgent?: string; ipAddress?: string } = {};

  if (typeof userAgentHeader === 'string' && userAgentHeader.length > 0) {
    result.userAgent = userAgentHeader;
  }

  const rawIp = forwardedIp || req.ip || undefined;
  if (rawIp) {
    result.ipAddress = rawIp;
  }

  return result;
}

function assertString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export async function handleGoogleCallback(
  req: RequestWithUser,
  res: Response,
): Promise<void> {
  try {
    const profile = req.user as any;

    if (!profile) {
      res.status(400).json({ error: 'No profile data received' });
      return;
    }

    const user = await findOrCreateUser({
      googleId: profile.id,
      email: profile.emails?.[0]?.value || '',
      name: profile.displayName || '',
      avatarUrl: profile.photos?.[0]?.value,
    });

    const token = generateJwt({
      userId: user.id,
      email: user.email,
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  } catch (error) {
    console.error('Google callback error:', error);
    res.status(500).json({
      error: 'Authentication failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export async function register(
  req: RequestWithUser,
  res: Response,
): Promise<void> {
  try {
    const { email, password, name } = req.body ?? {};

    if (
      !assertString(email) ||
      !assertString(password) ||
      !assertString(name)
    ) {
      res.status(400).json({
        error: 'email, password, and name are required',
      });
      return;
    }

    const normalizedEmail = normalizeEmail(email);
    const passwordValidation = validatePasswordStrength(password);

    if (!passwordValidation.valid) {
      res.status(400).json({
        error: 'Password does not satisfy security requirements',
        details: passwordValidation.errors,
      });
      return;
    }

    const existingUser = await findUserByEmail(normalizedEmail);
    const passwordHash = await hashPassword(password);

    const requiresEmailVerification = existingUser
      ? !existingUser.emailVerified
      : true;
    const verificationToken = requiresEmailVerification
      ? createEmailVerificationToken()
      : undefined;

    let user;

    if (existingUser) {
      if (existingUser.passwordHash) {
        res.status(409).json({ error: 'Email is already in use' });
        return;
      }

      const attachInput: {
        userId: string;
        passwordHash: string;
        emailVerified?: boolean;
        emailVerificationTokenHash?: string;
        emailVerificationTokenExpiresAt?: Date;
      } = {
        userId: existingUser.id,
        passwordHash,
        emailVerified: existingUser.emailVerified,
      };

      if (verificationToken) {
        attachInput.emailVerificationTokenHash = verificationToken.tokenHash;
        attachInput.emailVerificationTokenExpiresAt =
          verificationToken.expiresAt;
      }

      user = await attachLocalCredentialsToUser(attachInput);
    } else {
      user = await createLocalUser({
        email: normalizedEmail,
        name: name.trim(),
        passwordHash,
        emailVerificationTokenHash: verificationToken!.tokenHash,
        emailVerificationTokenExpiresAt: verificationToken!.expiresAt,
      });
    }

    res.status(201).json({
      message: 'Registration successful. Verify your email to continue.',
      data: {
        user: toAuthUser(user),
        requiresEmailVerification,
        verificationToken: verificationToken?.rawToken,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to register user',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export async function verifyEmail(
  req: RequestWithUser,
  res: Response,
): Promise<void> {
  try {
    const { token } = req.body ?? {};

    if (!assertString(token)) {
      res.status(400).json({ error: 'token is required' });
      return;
    }

    const tokenHash = hashOpaqueToken(token);
    const user = await findUserByVerificationTokenHash(tokenHash);

    if (!user || !user.emailVerificationTokenExpiresAt) {
      res.status(400).json({ error: 'Invalid verification token' });
      return;
    }

    if (isExpired(user.emailVerificationTokenExpiresAt)) {
      res.status(400).json({ error: 'Verification token expired' });
      return;
    }

    const verifiedUser = await markEmailAsVerified(user.id);

    res.json({
      message: 'Email verified successfully',
      data: { user: toAuthUser(verifiedUser) },
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to verify email',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export async function login(
  req: RequestWithUser,
  res: Response,
): Promise<void> {
  try {
    const { email, password } = req.body ?? {};

    if (!assertString(email) || !assertString(password)) {
      res.status(400).json({ error: 'email and password are required' });
      return;
    }

    const user = await findUserByEmail(normalizeEmail(email));

    if (!user || !user.passwordHash) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    if (user.lockoutUntil && !isExpired(user.lockoutUntil)) {
      res.status(423).json({
        error: 'Account is temporarily locked',
        lockoutUntil: user.lockoutUntil,
      });
      return;
    }

    const validPassword = await verifyPassword(password, user.passwordHash);

    if (!validPassword) {
      const nextAttempts = user.loginAttempts + 1;
      await incrementLoginAttempts(user.id);

      if (nextAttempts >= MAX_LOGIN_ATTEMPTS) {
        const lockoutUntil = new Date(
          Date.now() + LOGIN_LOCKOUT_MINUTES * 60000,
        );
        await setAccountLockout(user.id, lockoutUntil);
      }

      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    if (!user.emailVerified) {
      res.status(403).json({ error: 'Email is not verified' });
      return;
    }

    await resetLoginAttempts(user.id);

    const metadata = readRequestMeta(req);
    const issuedRefreshToken = await issueRefreshToken({
      userId: user.id,
      ...metadata,
    });

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
    });

    res.json({
      message: 'Login successful',
      data: {
        user: toAuthUser(user),
        tokens: {
          accessToken,
          refreshToken: issuedRefreshToken.refreshToken,
          tokenType: 'Bearer',
          expiresInSeconds: AUTH_TOKEN_TTL.accessTokenSeconds,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to login',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export async function refreshToken(
  req: RequestWithUser,
  res: Response,
): Promise<void> {
  try {
    const { refreshToken: rawRefreshToken } = req.body ?? {};

    if (!assertString(rawRefreshToken)) {
      res.status(400).json({ error: 'refreshToken is required' });
      return;
    }

    const metadata = readRequestMeta(req);
    const rotated = await rotateRefreshToken(rawRefreshToken, metadata);
    const user = await findUserById(rotated.record.userId);

    if (!user) {
      res.status(401).json({ error: 'User not found for refresh token' });
      return;
    }

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
    });

    res.json({
      message: 'Token refreshed',
      data: {
        tokens: {
          accessToken,
          refreshToken: rotated.refreshToken,
          tokenType: 'Bearer',
          expiresInSeconds: AUTH_TOKEN_TTL.accessTokenSeconds,
        },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const isUnauthorized =
      message.includes('Invalid refresh token') ||
      message.includes('Expired refresh token') ||
      message.includes('reuse detected');

    res.status(isUnauthorized ? 401 : 500).json({
      error: isUnauthorized
        ? 'Invalid or expired refresh token'
        : 'Failed to refresh token',
      message,
    });
  }
}

export async function setPassword(
  req: RequestWithUser,
  res: Response,
): Promise<void> {
  try {
    const user = req.user;
    const { newPassword } = req.body ?? {};

    if (!user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (!assertString(newPassword)) {
      res.status(400).json({ error: 'newPassword is required' });
      return;
    }

    if (user.passwordHash) {
      res.status(409).json({
        error: 'Password already exists. Use change-password instead.',
      });
      return;
    }

    const validation = validatePasswordStrength(newPassword);
    if (!validation.valid) {
      res.status(400).json({
        error: 'Password does not satisfy security requirements',
        details: validation.errors,
      });
      return;
    }

    const passwordHash = await hashPassword(newPassword);
    const updatedUser = await updatePasswordAndClearResetToken({
      userId: user.id,
      passwordHash,
    });

    await revokeAllUserRefreshTokens(
      user.id,
      REFRESH_TOKEN_REVOKE_REASONS.PASSWORD_CHANGED,
    );

    res.json({
      message: 'Password set successfully',
      data: { user: toAuthUser(updatedUser) },
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to set password',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export async function changePassword(
  req: RequestWithUser,
  res: Response,
): Promise<void> {
  try {
    const user = req.user;
    const { currentPassword, newPassword } = req.body ?? {};

    if (!user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (!assertString(currentPassword) || !assertString(newPassword)) {
      res
        .status(400)
        .json({ error: 'currentPassword and newPassword are required' });
      return;
    }

    if (!user.passwordHash) {
      res.status(400).json({
        error: 'Password is not set for this account. Use set-password first.',
      });
      return;
    }

    const currentPasswordValid = await verifyPassword(
      currentPassword,
      user.passwordHash,
    );
    if (!currentPasswordValid) {
      res.status(401).json({ error: 'Current password is incorrect' });
      return;
    }

    const validation = validatePasswordStrength(newPassword);
    if (!validation.valid) {
      res.status(400).json({
        error: 'Password does not satisfy security requirements',
        details: validation.errors,
      });
      return;
    }

    const passwordHash = await hashPassword(newPassword);
    const updatedUser = await updatePasswordAndClearResetToken({
      userId: user.id,
      passwordHash,
    });

    await revokeAllUserRefreshTokens(
      user.id,
      REFRESH_TOKEN_REVOKE_REASONS.PASSWORD_CHANGED,
    );

    res.json({
      message: 'Password changed successfully',
      data: { user: toAuthUser(updatedUser) },
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to change password',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export async function forgotPassword(
  req: RequestWithUser,
  res: Response,
): Promise<void> {
  try {
    const { email } = req.body ?? {};

    if (!assertString(email)) {
      res.status(400).json({ error: 'email is required' });
      return;
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await findUserByEmail(normalizedEmail);

    // Return a generic response to avoid leaking account existence.
    if (!user || !user.passwordHash) {
      res.json({
        message:
          'If your account exists, a password reset link has been issued.',
      });
      return;
    }

    const resetToken = createPasswordResetToken();
    await setPasswordResetToken({
      userId: user.id,
      tokenHash: resetToken.tokenHash,
      expiresAt: resetToken.expiresAt,
    });

    res.json({
      message: 'If your account exists, a password reset link has been issued.',
      data: {
        resetToken: resetToken.rawToken,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to process forgot-password request',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export async function resetPassword(
  req: RequestWithUser,
  res: Response,
): Promise<void> {
  try {
    const { token, newPassword } = req.body ?? {};

    if (!assertString(token) || !assertString(newPassword)) {
      res.status(400).json({ error: 'token and newPassword are required' });
      return;
    }

    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      res.status(400).json({
        error: 'Password does not satisfy security requirements',
        details: passwordValidation.errors,
      });
      return;
    }

    const tokenHash = hashOpaqueToken(token);
    const user = await findUserByPasswordResetTokenHash(tokenHash);

    if (!user || !user.passwordResetTokenExpiresAt) {
      res.status(400).json({ error: 'Invalid reset token' });
      return;
    }

    if (isExpired(user.passwordResetTokenExpiresAt)) {
      res.status(400).json({ error: 'Reset token expired' });
      return;
    }

    const passwordHash = await hashPassword(newPassword);
    const updatedUser = await updatePasswordAndClearResetToken({
      userId: user.id,
      passwordHash,
    });

    await revokeAllUserRefreshTokens(
      user.id,
      REFRESH_TOKEN_REVOKE_REASONS.PASSWORD_CHANGED,
    );

    res.json({
      message: 'Password reset successfully',
      data: { user: toAuthUser(updatedUser) },
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to reset password',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export function getCurrentUser(req: RequestWithUser, res: Response): void {
  const user = req.user;

  if (!user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  res.json({ user: toAuthUser(user) });
}

export async function logout(
  req: RequestWithUser,
  res: Response,
): Promise<void> {
  try {
    const { refreshToken: rawRefreshToken } = req.body ?? {};

    if (assertString(rawRefreshToken)) {
      await revokeRefreshToken(
        rawRefreshToken,
        REFRESH_TOKEN_REVOKE_REASONS.LOGOUT,
      );
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to logout',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
