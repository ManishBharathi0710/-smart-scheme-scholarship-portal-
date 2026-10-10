import { Request, Response, NextFunction } from 'express';
import { systemHealthService } from './services/system-health.service.js';

export class SystemHealthController {
  public getDetailedHealth = async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const data = await systemHealthService.getDetailedSystemHealth();
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };
}

export const systemHealthController = new SystemHealthController();
