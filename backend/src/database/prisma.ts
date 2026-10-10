import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ||
  new PrismaClient({
    log:
      env.NODE_ENV === 'development'
        ? [
            { emit: 'event', level: 'query' },
            { emit: 'event', level: 'info' },
            { emit: 'event', level: 'warn' },
            { emit: 'event', level: 'error' },
          ]
        : [{ emit: 'event', level: 'error' }],
  });

if (env.NODE_ENV === 'development') {
  global.__prisma = prisma;
}

// Log queries in development
if (env.NODE_ENV === 'development') {
  // @ts-expect-error Prisma event typing
  prisma.$on('query', (e: { query: string; params: string; duration: number }) => {
    logger.debug({ query: e.query, durationMs: e.duration }, 'Prisma Query');
  });
}

/**
 * Health check utility to verify database connectivity safely
 */
export async function checkDatabaseConnection(): Promise<{
  connected: boolean;
  responseTimeMs?: number;
  error?: string;
}> {
  const startTime = Date.now();
  try {
    // Perform a lightweight raw query
    await prisma.$queryRaw`SELECT 1`;
    const responseTimeMs = Date.now() - startTime;
    return { connected: true, responseTimeMs };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown database error';
    logger.warn({ error: message }, 'Database connectivity check failed');
    return { connected: false, error: message };
  }
}

/**
 * Connect to database with retry and exponential backoff
 */
export async function connectWithRetry(maxRetries = 5, initialDelayMs = 1000): Promise<boolean> {
  let delay = initialDelayMs;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const status = await checkDatabaseConnection();
    if (status.connected) {
      return true;
    }
    logger.warn(
      { attempt, maxRetries, nextRetryInMs: delay, error: status.error },
      `Database connection attempt ${attempt}/${maxRetries} failed. Retrying...`,
    );
    if (attempt < maxRetries) {
      await new Promise((res) => setTimeout(res, delay));
      delay *= 1.5;
    }
  }
  return false;
}

/**
 * Disconnect database on application shutdown
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info('Database client disconnected successfully');
  } catch (err) {
    logger.error({ err }, 'Error disconnecting database client');
  }
}
