import { Request, Response, NextFunction } from 'express';
import { dashboardService, DashboardService } from './dashboard.service.js';
import { HttpStatusCodes } from '../../types/api.js';

export class DashboardController {
  private readonly service: DashboardService;

  constructor(service: DashboardService = dashboardService) {
    this.service = service;
  }

  public getDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const data = await this.service.getDashboardData(userId);
      res.status(HttpStatusCodes.OK).json({
        success: true,
        data,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  public getActionItems = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const data = await this.service.getDashboardData(userId);
      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: data.actionItems,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    } catch (err) {
      next(err);
    }
  };
}

export const dashboardController = new DashboardController();
