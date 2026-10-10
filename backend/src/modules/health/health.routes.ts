import { Router } from 'express';
import { healthController } from './health.controller.js';

export const healthRouter = Router();

// GET /api/v1/health
healthRouter.get('/', healthController.getHealth);

// GET /api/v1/health/live
healthRouter.get('/live', healthController.getLive);

// GET /api/v1/health/ready
healthRouter.get('/ready', healthController.getReady);
