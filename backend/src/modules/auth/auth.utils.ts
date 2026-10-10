import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { JwtUserPayload, AuthUserSummary } from './auth.types.js';
import { AuthenticationError } from '../../errors/app-error.js';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateAccessToken(user: AuthUserSummary): string {
  const payload: JwtUserPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
  };

  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as unknown as NonNullable<SignOptions['expiresIn']>,
  };

  return jwt.sign(payload, env.JWT_SECRET, options);
}

export function verifyAccessToken(token: string): JwtUserPayload {
  try {
    return jwt.verify(token, env.JWT_SECRET) as JwtUserPayload;
  } catch (err: unknown) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new AuthenticationError('Access token has expired');
    }
    throw new AuthenticationError('Invalid or corrupted access token');
  }
}

export function generateRefreshToken(): { token: string; hash: string; expiresAt: Date } {
  // Generate 48 bytes of cryptographically secure random bytes
  const token = crypto.randomBytes(48).toString('hex');
  const hash = hashToken(token);
  // Default 7 days
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return { token, hash, expiresAt };
}

export function generatePasswordResetToken(): { token: string; hash: string; expiresAt: Date } {
  const token = crypto.randomBytes(32).toString('hex');
  const hash = hashToken(token);
  const expiresAt = new Date(Date.now() + env.PASSWORD_RESET_TOKEN_EXPIRES_IN_MINUTES * 60 * 1000);

  return { token, hash, expiresAt };
}
