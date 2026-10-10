import { pinoHttp } from 'pino-http';
import { logger } from '../utils/logger.js';
import { AppRequest } from '../types/index.js';

export const httpLoggerMiddleware = pinoHttp({
  logger,
  genReqId: (req) => (req as AppRequest).id || (req.headers['x-request-id'] as string) || 'unknown',
  customLogLevel: (_req, res, err) => {
    if (res.statusCode >= 500 || err) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  customSuccessMessage: (req, res) => {
    return `${req.method} ${req.url} - ${res.statusCode}`;
  },
  customErrorMessage: (req, res, err) => {
    return `${req.method} ${req.url} - ${res.statusCode} - ${err.message}`;
  },
});
