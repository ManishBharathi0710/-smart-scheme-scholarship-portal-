import { Request, Response, NextFunction } from 'express';
import { auditService } from './services/audit.service.js';
import { AuditLogQuery } from './analytics.types.js';
import { AuditResult } from '@prisma/client';

export class AuditController {
  public getAuditLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as AuditLogQuery;
      const result = await auditService.getAuditLogs(query);

      // Audit the viewing of audit logs (accountability for privileged access)
      await auditService.recordAuditLog({
        actorUserId: req.user!.id,
        actorEmail: req.user!.email,
        actorRole: req.user!.role,
        action: 'AUDIT_LOG_VIEWED',
        entityType: 'AUDIT_LOGS',
        result: AuditResult.SUCCESS,
        ipAddress: req.ip,
        metadata: { queryPage: query.page, queryAction: query.action },
      });

      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  public getAuditLogById = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params as { id: string };
      const result = await auditService.getAuditLogById(id);

      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };
}

export const auditController = new AuditController();
