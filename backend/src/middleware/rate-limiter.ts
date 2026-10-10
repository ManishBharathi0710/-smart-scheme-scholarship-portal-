import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { ErrorCodes, HttpStatusCodes } from '../types/api.js';

export const globalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: ErrorCodes.RATE_LIMITED,
      message: 'Too many requests from this IP, please try again later.',
    },
  },
  statusCode: HttpStatusCodes.RATE_LIMITED,
});

/**
 * Strict rate limiter for sensitive authentication endpoints (prevent brute-force attacks)
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: ErrorCodes.RATE_LIMITED,
      message: 'Too many authentication attempts. Please try again after 15 minutes.',
    },
  },
  statusCode: HttpStatusCodes.RATE_LIMITED,
});

/**
 * Rate limiter for AI assistant endpoints to prevent prompt flooding and API cost spikes
 */
export const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: env.AI_REQUESTS_PER_MINUTE || 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: ErrorCodes.RATE_LIMITED,
      message: 'Too many AI requests. Please wait a moment before sending another query.',
    },
  },
  statusCode: HttpStatusCodes.RATE_LIMITED,
});
