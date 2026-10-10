import { ErrorCodes, HttpStatusCodes } from '../types/api.js';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number = HttpStatusCodes.INTERNAL_SERVER_ERROR,
    errorCode: string = ErrorCodes.INTERNAL_ERROR,
    isOperational: boolean = true,
    details?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', details?: unknown) {
    super(message, HttpStatusCodes.BAD_REQUEST, ErrorCodes.VALIDATION_ERROR, true, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, HttpStatusCodes.UNAUTHORIZED, ErrorCodes.UNAUTHORIZED, true);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions to perform this action') {
    super(message, HttpStatusCodes.FORBIDDEN, ErrorCodes.FORBIDDEN, true);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, HttpStatusCodes.NOT_FOUND, ErrorCodes.NOT_FOUND, true);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict detected') {
    super(message, HttpStatusCodes.CONFLICT, ErrorCodes.CONFLICT, true);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests, please try again later') {
    super(message, HttpStatusCodes.RATE_LIMITED, ErrorCodes.RATE_LIMITED, true);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed', details?: unknown) {
    super(message, HttpStatusCodes.INTERNAL_SERVER_ERROR, ErrorCodes.DATABASE_ERROR, true, details);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error occurred') {
    super(message, HttpStatusCodes.INTERNAL_SERVER_ERROR, ErrorCodes.INTERNAL_ERROR, false);
  }
}
