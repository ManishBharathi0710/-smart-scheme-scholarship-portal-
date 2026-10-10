import { prisma } from '../../../database/prisma.js';
import { CreateEventParams } from '../analytics.types.js';
import { logger } from '../../../utils/logger.js';
import { Prisma } from '@prisma/client';

export class AnalyticsEventService {
  /**
   * Asynchronously records a platform analytics event.
   * Completely decoupled and non-blocking: failure will never interrupt core business flows.
   */
  public async recordEvent(params: CreateEventParams): Promise<void> {
    try {
      await prisma.analyticsEvent.create({
        data: {
          eventType: params.eventType,
          category: params.category,
          actorType: params.actorType || 'USER',
          actorId: params.actorId || null,
          entityType: params.entityType || null,
          entityId: params.entityId || null,
          metadata: params.metadata ? (params.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
          sessionId: params.sessionId || null,
          requestId: params.requestId || null,
        },
      });
    } catch (error) {
      logger.warn({
        event: 'ANALYTICS_RECORDING_FAILED',
        eventType: params.eventType,
        error: error instanceof Error ? error.message : String(error),
        msg: 'Failed to record analytics event. Core business operation unaffected.',
      });
    }
  }

  /**
   * Helper to count events within time window
   */
  public async countEvents(eventType: string, startDate?: Date, endDate?: Date): Promise<number> {
    try {
      const where: Prisma.AnalyticsEventWhereInput = { eventType };
      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) where.timestamp.gte = startDate;
        if (endDate) where.timestamp.lte = endDate;
      }
      return await prisma.analyticsEvent.count({ where });
    } catch {
      return 0;
    }
  }
}

export const analyticsEventService = new AnalyticsEventService();
