import { Router } from 'express';
import { dashboardController } from './dashboard.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

export const dashboardRouter = Router();

// All dashboard endpoints require authenticated citizen access
dashboardRouter.use(authenticate);

dashboardRouter.get('/', dashboardController.getDashboard);
dashboardRouter.get('/action-items', dashboardController.getActionItems);
