import { Request, Response, NextFunction } from 'express';
import { NotificationService } from './notifications.service.js';
import { NotificationQueryFilters } from './notifications.types.js';
import { notificationScheduler } from './jobs/scheduler.js';

export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService = new NotificationService(),
  ) {}

  public getNotifications = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const filters = req.query as unknown as NotificationQueryFilters;
      const result = await this.notificationService.getUserNotifications(userId, filters);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public getUnreadCount = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const count = await this.notificationService.getUnreadCount(userId);

      res.status(200).json({
        success: true,
        data: { count },
      });
    } catch (error) {
      next(error);
    }
  };

  public markAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { notificationId } = req.params as { notificationId: string };
      const updated = await this.notificationService.markAsRead(userId, notificationId);

      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  };

  public markAllAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const result = await this.notificationService.markAllAsRead(userId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public deleteNotification = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { notificationId } = req.params as { notificationId: string };
      await this.notificationService.deleteNotification(userId, notificationId);

      res.status(200).json({
        success: true,
        message: 'Notification deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  public getPreferences = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const preferences = await this.notificationService.getUserPreferences(userId);

      res.status(200).json({
        success: true,
        data: preferences,
      });
    } catch (error) {
      next(error);
    }
  };

  public updatePreferences = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const updated = await this.notificationService.updateUserPreferences(userId, req.body);

      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  };

  public runScheduledJobs = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { job } = (req.body ?? {}) as {
        job?: 'deadline' | 'opening' | 'doc_expiry' | 'cleanup' | 'all';
      };
      const results = await notificationScheduler.runJob(job ?? 'all');

      res.status(200).json({
        success: true,
        data: results,
      });
    } catch (error) {
      next(error);
    }
  };
}
