import { Request, Response, NextFunction } from 'express';
import { savedSchemesService, SavedSchemesService } from './saved-schemes.service.js';
import { HttpStatusCodes } from '../../types/api.js';

export class SavedSchemesController {
  private readonly service: SavedSchemesService;

  constructor(service: SavedSchemesService = savedSchemesService) {
    this.service = service;
  }

  public saveScheme = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const schemeId = req.params.schemeId as string;

      const result = await this.service.saveScheme(userId, schemeId);
      res.status(HttpStatusCodes.CREATED).json({
        success: true,
        data: result,
        meta: {
          message: 'Scheme saved to your collection successfully.',
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  public removeSavedScheme = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const schemeId = req.params.schemeId as string;

      const result = await this.service.removeSavedScheme(userId, schemeId);
      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: result,
        meta: {
          message: 'Scheme removed from your saved collection.',
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  public getSavedSchemes = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const query = req.query as unknown as Parameters<typeof this.service.getUserSavedSchemes>[1];

      const result = await this.service.getUserSavedSchemes(userId, query);
      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: result.items,
        meta: {
          pagination: result.pagination,
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  public getSavedSchemeIds = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const result = await this.service.getUserSavedSchemeIds(userId);
      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: {
          schemeIds: result.savedSchemeIds,
          count: result.savedSchemeIds.length,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  public getSchemeSaveStatus = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const schemeId = req.params.schemeId as string;

      const result = await this.service.getSchemeSaveStatus(userId, schemeId);
      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: {
          saved: result.isSaved,
          schemeId,
        },
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

export const savedSchemesController = new SavedSchemesController();
