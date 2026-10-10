import { Server } from 'http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { disconnectDatabase, connectWithRetry } from './database/prisma.js';
import { ensureLocalDatabaseRunning, stopLocalDatabase } from './scripts/local-db.js';

let server: Server | null = null;

async function startServer(): Promise<void> {
  try {
    logger.info({ environment: env.NODE_ENV, port: env.PORT }, 'Starting server initialization...');

    // In development mode, auto-start embedded database if port 5432 is not running
    if (env.NODE_ENV === 'development') {
      await ensureLocalDatabaseRunning();
    }

    // Test database connection on startup with resilient retry
    const isConnected = await connectWithRetry(env.NODE_ENV === 'production' ? 5 : 2);
    if (isConnected) {
      logger.info('✅ Database connection established successfully');
    } else {
      logger.warn(
        '⚠️ Database connection not reachable after retries. Service running in degraded mode.',
      );
    }

    const app = createApp();

    server = app.listen(env.PORT, () => {
      logger.info(
        `🚀 Smart Scheme Backend running on http://localhost:${env.PORT}${env.API_PREFIX}`,
      );
      logger.info(`🔍 Health check: http://localhost:${env.PORT}${env.API_PREFIX}/health`);
    });

    // Register process termination handlers
    setupGracefulShutdown();
  } catch (err) {
    logger.fatal({ err }, 'Failed to start server');
    process.exit(1);
  }
}

function setupGracefulShutdown(): void {
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Initiating graceful shutdown...`);

    if (server && server.listening) {
      server.close(async (err) => {
        if (err) {
          logger.error({ err }, 'Error closing HTTP server');
          process.exit(1);
        }

        logger.info('HTTP server closed');

        try {
          await disconnectDatabase();
          await stopLocalDatabase();
          logger.info('Graceful shutdown completed successfully');
          process.exit(0);
        } catch (dbErr) {
          logger.error({ dbErr }, 'Error during database disconnection');
          process.exit(1);
        }
      });

      // Force close if graceful shutdown hangs
      setTimeout(() => {
        logger.error('Graceful shutdown timed out after 10s, forcing exit');
        process.exit(1);
      }, 10000).unref();
    } else {
      try {
        await disconnectDatabase();
        await stopLocalDatabase();
      } catch {
        // ignore
      }
      process.exit(0);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled Promise Rejection caught at process level');
  });

  process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'Uncaught Exception caught at process level');
    shutdown('uncaughtException');
  });
}

// Start the server
startServer();
