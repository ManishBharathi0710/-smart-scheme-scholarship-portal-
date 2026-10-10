import { Request, Response, NextFunction } from 'express';
import { schemesService } from './schemes.service.js';
import { SchemeFilterQuery } from './schemes.types.js';
import { HttpStatusCodes } from '../../types/api.js';

export class SchemesController {
  /**
   * Public: List published & verified schemes
   */
  public async getPublishedSchemes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await schemesService.getPublishedSchemes(
        req.query as unknown as SchemeFilterQuery,
        req.user?.id,
      );
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
  }

  /**
   * Public: Get published scheme detail by slug or ID
   */
  public async getPublishedSchemeDetail(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const scheme = await schemesService.getPublishedSchemeDetail(
        req.params.idOrSlug as string,
        req.user?.id,
      );
      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: scheme,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Public / Authenticated: Compare 1 to 4 schemes side-by-side
   */
  public async compareSchemes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let schemeIds: string[] = [];

      if (req.method === 'POST' && Array.isArray(req.body?.schemeIds)) {
        schemeIds = req.body.schemeIds;
      } else if (typeof req.query.ids === 'string') {
        schemeIds = req.query.ids
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      } else if (Array.isArray(req.query.ids)) {
        schemeIds = req.query.ids
          .map(String)
          .map((s) => s.trim())
          .filter(Boolean);
      }

      const comparison = await schemesService.compareSchemes(schemeIds, req.user?.id);

      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: comparison,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Public: Filter metadata (categories, program types, departments)
   */
  public async getFilterMetadata(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const meta = await schemesService.getFilterMetadata();
      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: meta,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin: List all schemes across all lifecycle states
   */
  public async getAllSchemesAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await schemesService.getAllSchemesAdmin(
        req.query as unknown as SchemeFilterQuery,
      );
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
  }

  /**
   * Admin: Get scheme full record
   */
  public async getSchemeByIdAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const scheme = await schemesService.getSchemeByIdAdmin(req.params.id as string);
      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: scheme,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin: Create new scheme draft
   */
  public async createScheme(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const scheme = await schemesService.createScheme(req.body, req.user!.id);
      res.status(HttpStatusCodes.CREATED).json({
        success: true,
        data: scheme,
        meta: {
          message: 'Scheme draft created successfully',
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin: Update scheme and create version
   */
  public async updateScheme(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await schemesService.updateScheme(
        req.params.id as string,
        req.body,
        req.user!.id,
      );
      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: updated,
        meta: {
          message: 'Scheme updated and new version snapshot created',
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin: Submit draft for verification
   */
  public async submitForVerification(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const updated = await schemesService.submitForVerification(
        req.params.id as string,
        req.user!.id,
      );
      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: updated,
        meta: {
          message: 'Scheme submitted for official verification',
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Verifier/Admin: Verify and approve scheme
   */
  public async verifyScheme(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await schemesService.verifyScheme(
        req.params.id as string,
        req.body.verificationNotes,
        req.user!.id,
      );
      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: updated,
        meta: {
          message: 'Scheme officially verified and approved for publishing',
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Verifier/Admin: Reject verification
   */
  public async rejectVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await schemesService.rejectVerification(
        req.params.id as string,
        req.body.rejectionReason,
        req.user!.id,
      );
      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: updated,
        meta: {
          message: 'Scheme verification rejected with feedback for revision',
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin: Publish verified scheme
   */
  public async publishScheme(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await schemesService.publishScheme(req.params.id as string, req.user!.id);
      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: updated,
        meta: {
          message: 'Scheme published and active for citizen discovery',
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin: Unpublish scheme
   */
  public async unpublishScheme(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await schemesService.unpublishScheme(req.params.id as string, req.user!.id);
      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: updated,
        meta: {
          message: 'Scheme unpublished successfully',
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin: Discontinue scheme
   */
  public async discontinueScheme(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await schemesService.discontinueScheme(req.params.id as string, req.user!.id);
      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: updated,
        meta: {
          message: 'Scheme discontinued and archived from active applications',
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin: Soft-delete scheme
   */
  public async deleteScheme(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await schemesService.deleteScheme(req.params.id as string, req.user!.id);
      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Departments
   */
  public async getDepartments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const departments = await schemesService.getDepartments();
      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: departments,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public async createDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dept = await schemesService.createDepartment(req.body);
      res.status(HttpStatusCodes.CREATED).json({
        success: true,
        data: dept,
        meta: {
          message: 'Department registered successfully',
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Versions
   */
  public async getSchemeVersions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const versions = await schemesService.getSchemeVersions(req.params.id as string);
      res.status(HttpStatusCodes.OK).json({
        success: true,
        data: versions,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const schemesController = new SchemesController();
