import { Request, Response, NextFunction } from 'express';
import { analyticsService } from './services/analytics.service.js';
import { exportService } from './services/export.service.js';
import { analyticsEventService } from './services/analytics-event.service.js';
import { AnalyticsDateFilter, ExportRequestDto, CreateEventParams } from './analytics.types.js';

export class AnalyticsController {
  public getOverview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filter = req.query as unknown as AnalyticsDateFilter;
      const data = await analyticsService.getPlatformOverview(filter);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  public getUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filter = req.query as unknown as AnalyticsDateFilter;
      const data = await analyticsService.getUserAnalytics(filter);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  public getSchemes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filter = req.query as unknown as AnalyticsDateFilter;
      const data = await analyticsService.getSchemeAnalytics(filter);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  public getRecommendations = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const filter = req.query as unknown as AnalyticsDateFilter;
      const data = await analyticsService.getRecommendationAnalytics(filter);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  public getDocuments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filter = req.query as unknown as AnalyticsDateFilter;
      const data = await analyticsService.getDocumentAnalytics(filter);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  public getNotifications = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const filter = req.query as unknown as AnalyticsDateFilter;
      const data = await analyticsService.getNotificationAnalytics(filter);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  public getAi = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filter = req.query as unknown as AnalyticsDateFilter;
      const data = await analyticsService.getAiAnalytics(filter);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  public getSearch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filter = req.query as unknown as AnalyticsDateFilter;
      const data = await analyticsService.getSearchAnalytics(filter);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  public exportData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as ExportRequestDto;
      const actor = {
        id: req.user!.id,
        email: req.user!.email,
        role: req.user!.role,
        ipAddress: req.ip,
      };

      const result = await exportService.generateExport(body, actor);

      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.status(200).send(result.data);
    } catch (error) {
      next(error);
    }
  };

  public recordEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as CreateEventParams;
      await analyticsEventService.recordEvent({
        ...body,
        actorId: req.user?.id || null,
        requestId: (req.headers['x-request-id'] as string) || null,
      });

      res.status(200).json({ success: true, message: 'Event recorded.' });
    } catch (error) {
      next(error);
    }
  };
}

export const analyticsController = new AnalyticsController();
