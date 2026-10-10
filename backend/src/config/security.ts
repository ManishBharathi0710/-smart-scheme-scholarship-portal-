import { env } from './env.js';

export const securityConfig = {
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshSecret: env.REFRESH_TOKEN_SECRET,
    refreshExpiresIn: env.REFRESH_TOKEN_EXPIRES_IN,
    passwordResetExpiresMinutes: env.PASSWORD_RESET_TOKEN_EXPIRES_IN_MINUTES,
  },
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX,
    authMaxRequests: 20, // strict 20 req per 15 min for auth/login
    aiMaxRequestsPerMinute: env.AI_REQUESTS_PER_MINUTE,
  },
  cors: {
    allowedOrigins: env.CORS_ORIGINS.split(',').map((o) => o.trim()),
    credentials: true,
    maxAgeSeconds: 86400,
  },
  bcryptRounds: 10,
  auditLogRetentionDays: env.AUDIT_LOG_RETENTION_DAYS,
};
