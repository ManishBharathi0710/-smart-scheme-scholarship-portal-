import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/app-error.js';
import { ApiErrorResponse, ErrorCodes, HttpStatusCodes } from '../types/api.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  const requestId = req.id ? String(req.id) : (req.headers['x-request-id'] as string) || undefined;

  if (err instanceof AppError) {
    if (!err.isOperational) {
      logger.error({ err, requestId }, 'Non-operational AppError encountered');
    }

    const responseBody: ApiErrorResponse = {
      success: false,
      error: {
        code: err.errorCode,
        message: err.message,
        details: err.details ?? undefined,
        requestId,
      },
    };

    res.status(err.statusCode).json(responseBody);
    return;
  }

  // Unhandled / system errors
  logger.error({ err, requestId }, 'Unhandled system error caught by global error handler');

  const isProduction = env.NODE_ENV === 'production';
  const responseBody: ApiErrorResponse = {
    success: false,
    error: {
      code: ErrorCodes.INTERNAL_ERROR,
      message: isProduction ? 'An unexpected internal error occurred' : err.message,
      requestId,
    },
  };

  res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json(responseBody);
}
