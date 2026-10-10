import { Request, Response, NextFunction } from 'express';
import { HealthService, healthService } from './health.service.js';
import { HttpStatusCodes } from '../../types/api.js';

export class HealthController {
  private readonly service: HealthService;

  constructor(service: HealthService = healthService) {
    this.service = service;
  }

  getHealth = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const healthData = await this.service.getSystemHealth();
      const statusCode =
        healthData.status === 'healthy' ? HttpStatusCodes.OK : HttpStatusCodes.SERVICE_UNAVAILABLE;

      res.status(statusCode).json({
        success: true,
        data: healthData,
        message: `System is ${healthData.status}`,
      });
    } catch (err) {
      next(err);
    }
  };

  getLive = (_req: Request, res: Response): void => {
    const liveData = this.service.getLiveness();
    res.status(HttpStatusCodes.OK).json({
      success: true,
      data: liveData,
    });
  };

  getReady = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const readyData = await this.service.getReadiness();
      const statusCode = readyData.ready ? HttpStatusCodes.OK : HttpStatusCodes.SERVICE_UNAVAILABLE;

      res.status(statusCode).json({
        success: readyData.ready,
        data: readyData,
      });
    } catch (err) {
      next(err);
    }
  };
}

export const healthController = new HealthController();
