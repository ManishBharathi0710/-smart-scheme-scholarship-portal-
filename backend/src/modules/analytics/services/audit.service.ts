import { prisma } from '../../../database/prisma.js';
import { CreateAuditLogParams, AuditLogQuery, AuditLogRecordDto } from '../analytics.types.js';
import { AuditResult, Prisma } from '@prisma/client';
import { logger } from '../../../utils/logger.js';
import { NotFoundError } from '../../../errors/app-error.js';

export class AuditService {
  /**
   * Append-only audit logging for sensitive actions, administrative state changes, and access events.
   */
  public async recordAuditLog(params: CreateAuditLogParams): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          actorUserId: params.actorUserId || null,
          actorEmail: params.actorEmail || null,
          actorRole: params.actorRole,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId || null,
          result: params.result || AuditResult.SUCCESS,
          ipAddress: params.ipAddress || null,
          userAgent: params.userAgent || null,
          requestId: params.requestId || null,
          metadata: params.metadata ? (params.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
        },
      });
    } catch (error) {
      logger.error({
        event: 'AUDIT_LOG_WRITE_FAILURE',
        action: params.action,
        error: error instanceof Error ? error.message : String(error),
        msg: 'Failed to persist critical audit record.',
      });
    }
  }

  /**
   * Search audit logs with strict filtering, pagination, and sorting.
   */
  public async getAuditLogs(query: AuditLogQuery): Promise<{
    items: AuditLogRecordDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 100) : 20;
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {};

    if (query.actorUserId) where.actorUserId = query.actorUserId;
    if (query.action) where.action = { contains: query.action, mode: 'insensitive' };
    if (query.entityType) where.entityType = { contains: query.entityType, mode: 'insensitive' };
    if (query.result) where.result = query.result;
    if (query.requestId) where.requestId = query.requestId;

    if (query.startDate || query.endDate) {
      where.timestamp = {};
      if (query.startDate) where.timestamp.gte = new Date(query.startDate);
      if (query.endDate) where.timestamp.lte = new Date(query.endDate);
    }

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      items: items.map((i) => ({
        id: i.id,
        actorUserId: i.actorUserId,
        actorEmail: i.actorEmail,
        actorRole: i.actorRole,
        action: i.action,
        entityType: i.entityType,
        entityId: i.entityId,
        result: i.result,
        ipAddress: i.ipAddress,
        userAgent: i.userAgent,
        requestId: i.requestId,
        metadata: (i.metadata as Record<string, unknown>) || null,
        timestamp: i.timestamp.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Retrieve single audit log by ID
   */
  public async getAuditLogById(id: string): Promise<AuditLogRecordDto> {
    const log = await prisma.auditLog.findUnique({
      where: { id },
    });

    if (!log) {
      throw new NotFoundError('Audit log entry not found.');
    }

    return {
      id: log.id,
      actorUserId: log.actorUserId,
      actorEmail: log.actorEmail,
      actorRole: log.actorRole,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      result: log.result,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      requestId: log.requestId,
      metadata: (log.metadata as Record<string, unknown>) || null,
      timestamp: log.timestamp.toISOString(),
    };
  }
}

export const auditService = new AuditService();
