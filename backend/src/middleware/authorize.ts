import { Request, Response, NextFunction } from 'express';
import { AuthenticationError, AuthorizationError } from '../errors/app-error.js';
import { UserRole } from '@prisma/client';

export function authorizeRole(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AuthenticationError('Authentication required before authorization check'));
    }

    const userRole = req.user.role as UserRole;

    if (!allowedRoles.includes(userRole)) {
      return next(
        new AuthorizationError(
          `Insufficient permissions. Required one of: [${allowedRoles.join(', ')}]`,
        ),
      );
    }

    next();
  };
}
