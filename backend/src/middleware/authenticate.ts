import { Request, Response, NextFunction } from 'express';
import { AuthenticationError } from '../errors/app-error.js';
import { verifyAccessToken } from '../modules/auth/auth.utils.js';
import { UserStatus } from '@prisma/client';

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthenticationError('Authentication required. Missing or malformed Bearer token.');
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    throw new AuthenticationError('Authentication token is missing.');
  }

  try {
    const payload = verifyAccessToken(token);

    if (payload.status !== UserStatus.ACTIVE) {
      throw new AuthenticationError('Account is inactive or suspended.');
    }

    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };

    next();
  } catch (err) {
    next(err);
  }
}

export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    return next();
  }

  try {
    const payload = verifyAccessToken(token);

    if (payload.status === UserStatus.ACTIVE) {
      req.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      };
    }
  } catch {
    // Silently continue for optional authentication
  }

  next();
}
