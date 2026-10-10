import { env } from './env.js';

export const databaseConfig = {
  url: env.DATABASE_URL,
  poolMin: env.DATABASE_POOL_MIN,
  poolMax: env.DATABASE_POOL_MAX,
  timeoutMs: env.DATABASE_TIMEOUT_MS,
  maxConnectRetries: 5,
  retryDelayMs: 1500,
  logQueries: env.NODE_ENV === 'development',
};
