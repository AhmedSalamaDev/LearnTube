import { eq } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { users, type User, type NewUser } from '../db/schema.ts';

export async function findUserByGoogleId(
  googleId: string,
): Promise<User | undefined> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.googleId, googleId))
    .limit(1);

  return result[0];
}

export async function findUserByEmail(
  email: string,
): Promise<User | undefined> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return result[0];
}

export async function createUser(userData: NewUser): Promise<User> {
  const result = await db.insert(users).values(userData).returning();

  if (!result[0]) {
    throw new Error('Failed to create user');
  }

  return result[0];
}

export async function findOrCreateUser(profile: {
  googleId: string;
  email: string;
  name: string;
  avatarUrl?: string;
}): Promise<User> {
  let user = await findUserByGoogleId(profile.googleId);

  if (user) {
    return user;
  }

  user = await findUserByEmail(profile.email);

  if (user) {
    const updated = await db
      .update(users)
      .set({
        googleId: profile.googleId,
        emailVerified: true,
        emailVerificationTokenHash: null,
        emailVerificationTokenExpiresAt: null,
      })
      .where(eq(users.id, user.id))
      .returning();

    if (!updated[0]) {
      throw new Error('Failed to update user');
    }

    return updated[0];
  }

  return await createUser({
    googleId: profile.googleId,
    email: profile.email,
    name: profile.name,
    avatarUrl: profile.avatarUrl,
    emailVerified: true,
  });
}

export async function findUserById(userId: string): Promise<User | undefined> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return result[0];
}

export async function createLocalUser(input: {
  email: string;
  name: string;
  passwordHash: string;
  emailVerificationTokenHash: string;
  emailVerificationTokenExpiresAt: Date;
}): Promise<User> {
  return createUser({
    email: input.email,
    name: input.name,
    passwordHash: input.passwordHash,
    emailVerified: false,
    emailVerificationTokenHash: input.emailVerificationTokenHash,
    emailVerificationTokenExpiresAt: input.emailVerificationTokenExpiresAt,
  });
}

export async function attachLocalCredentialsToUser(input: {
  userId: string;
  passwordHash: string;
  emailVerificationTokenHash?: string;
  emailVerificationTokenExpiresAt?: Date;
  emailVerified?: boolean;
}): Promise<User> {
  const updateInput: Partial<NewUser> = {
    passwordHash: input.passwordHash,
    lastPasswordChangeAt: new Date(),
    loginAttempts: 0,
    lockoutUntil: null,
  };

  if (input.emailVerificationTokenHash) {
    updateInput.emailVerificationTokenHash = input.emailVerificationTokenHash;
  } else {
    updateInput.emailVerificationTokenHash = null;
  }

  if (input.emailVerificationTokenExpiresAt) {
    updateInput.emailVerificationTokenExpiresAt =
      input.emailVerificationTokenExpiresAt;
  } else {
    updateInput.emailVerificationTokenExpiresAt = null;
  }

  if (typeof input.emailVerified === 'boolean') {
    updateInput.emailVerified = input.emailVerified;
  }

  const updated = await db
    .update(users)
    .set(updateInput)
    .where(eq(users.id, input.userId))
    .returning();

  if (!updated[0]) {
    throw new Error('Failed to attach local credentials');
  }

  return updated[0];
}

export async function markEmailAsVerified(userId: string): Promise<User> {
  const updated = await db
    .update(users)
    .set({
      emailVerified: true,
      emailVerificationTokenHash: null,
      emailVerificationTokenExpiresAt: null,
    })
    .where(eq(users.id, userId))
    .returning();

  if (!updated[0]) {
    throw new Error('Failed to mark email as verified');
  }

  return updated[0];
}

export async function findUserByVerificationTokenHash(
  tokenHash: string,
): Promise<User | undefined> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.emailVerificationTokenHash, tokenHash))
    .limit(1);

  return result[0];
}

export async function setPasswordResetToken(input: {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}): Promise<void> {
  await db
    .update(users)
    .set({
      passwordResetTokenHash: input.tokenHash,
      passwordResetTokenExpiresAt: input.expiresAt,
    })
    .where(eq(users.id, input.userId));
}

export async function findUserByPasswordResetTokenHash(
  tokenHash: string,
): Promise<User | undefined> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.passwordResetTokenHash, tokenHash))
    .limit(1);

  return result[0];
}

export async function updatePasswordAndClearResetToken(input: {
  userId: string;
  passwordHash: string;
}): Promise<User> {
  const updated = await db
    .update(users)
    .set({
      passwordHash: input.passwordHash,
      passwordResetTokenHash: null,
      passwordResetTokenExpiresAt: null,
      lastPasswordChangeAt: new Date(),
      loginAttempts: 0,
      lockoutUntil: null,
    })
    .where(eq(users.id, input.userId))
    .returning();

  if (!updated[0]) {
    throw new Error('Failed to update password');
  }

  return updated[0];
}

export async function incrementLoginAttempts(userId: string): Promise<void> {
  const user = await findUserById(userId);

  if (!user) {
    return;
  }

  await db
    .update(users)
    .set({
      loginAttempts: user.loginAttempts + 1,
    })
    .where(eq(users.id, userId));
}

export async function resetLoginAttempts(userId: string): Promise<void> {
  await db
    .update(users)
    .set({ loginAttempts: 0, lockoutUntil: null })
    .where(eq(users.id, userId));
}

export async function setAccountLockout(
  userId: string,
  lockoutUntil: Date,
): Promise<void> {
  await db.update(users).set({ lockoutUntil }).where(eq(users.id, userId));
}
