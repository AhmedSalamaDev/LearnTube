import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';
import { AUTH_PASSWORD_RULES } from '../utils/auth.contracts.ts';

const scrypt = promisify(scryptCallback);
const PASSWORD_HASH_PREFIX = 'scrypt';
const KEY_LENGTH = 64;

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

export function validatePasswordStrength(
  password: string,
): PasswordValidationResult {
  const errors: string[] = [];

  if (password.length < AUTH_PASSWORD_RULES.minLength) {
    errors.push(
      `Password must be at least ${AUTH_PASSWORD_RULES.minLength} characters long.`,
    );
  }

  if (AUTH_PASSWORD_RULES.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must include at least one uppercase letter.');
  }

  if (AUTH_PASSWORD_RULES.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must include at least one lowercase letter.');
  }

  if (AUTH_PASSWORD_RULES.requireDigit && !/[0-9]/.test(password)) {
    errors.push('Password must include at least one digit.');
  }

  if (
    AUTH_PASSWORD_RULES.requireSymbol &&
    !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)
  ) {
    errors.push('Password must include at least one symbol.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const hash = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  return `${PASSWORD_HASH_PREFIX}:${salt}:${hash.toString('hex')}`;
}

export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  const [prefix, salt, hashHex] = storedHash.split(':');

  if (!prefix || !salt || !hashHex || prefix !== PASSWORD_HASH_PREFIX) {
    return false;
  }

  const expectedHash = Buffer.from(hashHex, 'hex');
  const computedHash = (await scrypt(
    password,
    salt,
    expectedHash.length,
  )) as Buffer;

  if (expectedHash.length !== computedHash.length) {
    return false;
  }

  return timingSafeEqual(expectedHash, computedHash);
}
