import path from 'path';
import fs from 'fs';
import express, { Express } from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { requestIdMiddleware } from './middleware/request-id.js';
import { httpLoggerMiddleware } from './middleware/http-logger.js';
import { corsMiddleware } from './middleware/cors.js';
import { globalRateLimiter } from './middleware/rate-limiter.js';
import { notFoundHandler } from './middleware/not-found-handler.js';
import { errorHandler } from './middleware/error-handler.js';
import { v1Router } from './routes/index.js';

import { healthController } from './modules/health/health.controller.js';

const appDir = typeof __dirname !== 'undefined' ? __dirname : process.cwd();

export function createApp(): Express {
  const app = express();

  // Baseline security headers hardened for production
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  // CORS handling
  app.use(corsMiddleware);

  // Request correlation ID
  app.use(requestIdMiddleware);

  // Structured HTTP logging
  app.use(httpLoggerMiddleware);

  // Request body parsing with strict size limit
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  // Root-level health & readiness probes for container orchestrators
  app.get('/health', healthController.getHealth);
  app.get('/ready', healthController.getReady);
  app.get('/live', healthController.getLive);

  // Global baseline rate limiting
  app.use(globalRateLimiter);

  // API v1 routes
  app.use(env.API_PREFIX, v1Router);

  // Serve static frontend build assets if available
  const candidateDirs = [
    path.resolve(process.cwd(), 'frontend/dist'),
    path.resolve(process.cwd(), '../frontend/dist'),
    path.resolve(appDir, '../../frontend/dist'),
  ];
  const frontendDist = candidateDirs.find((dir) => fs.existsSync(path.join(dir, 'index.html')));

  if (frontendDist) {
    app.use(express.static(frontendDist));

    // Client-side SPA routing fallback (for non-API GET requests)
    app.get('*', (req, res, next) => {
      if (
        req.path.startsWith(env.API_PREFIX) ||
        req.path === '/health' ||
        req.path === '/ready' ||
        req.path === '/live'
      ) {
        return next();
      }
      res.sendFile(path.join(frontendDist, 'index.html'));
    });
  }

  // Catch-all 404 handler for undefined routes
  app.use(notFoundHandler);

  // Centralized global error handling
  app.use(errorHandler);

  return app;
}
