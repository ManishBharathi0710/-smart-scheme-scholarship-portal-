import { PrismaClient } from '@prisma/client';
import { prisma } from '../../../database/prisma.js';
import {
  NotificationEventService,
  notificationEventService,
} from '../notifications.event-service.js';
import { logger } from '../../../utils/logger.js';

export class DocumentExpiryJob {
  private readonly warningThresholds = [15, 7, 1];

  constructor(
    private readonly db: PrismaClient = prisma,
    private readonly eventService: NotificationEventService = notificationEventService,
  ) {}

  public async run(now: Date = new Date()): Promise<{
    expiringAlerts: number;
    expiredAlerts: number;
  }> {
    logger.info('Starting DocumentExpiryJob scan');
    let expiringAlerts = 0;
    let expiredAlerts = 0;

    const documentsWithExpiry = await this.db.userDocument.findMany({
      where: {
        isCurrent: true,
        deletedAt: null,
        expiresAt: { not: null },
      },
    });

    for (const doc of documentsWithExpiry) {
      if (!doc.expiresAt) continue;

      const daysRemaining = this.calculateCalendarDaysRemaining(now, doc.expiresAt);

      if (daysRemaining < 0) {
        // Document has expired
        const result = await this.eventService.publishDocumentEvent({
          userId: doc.userId,
          documentId: doc.id,
          documentType: doc.documentType,
          originalFileName: doc.originalFileName,
          type: 'DOCUMENT_EXPIRED',
          expiresAt: doc.expiresAt,
          daysRemaining,
        });

        if (result) expiredAlerts++;
      } else if (this.warningThresholds.includes(daysRemaining)) {
        // Document is expiring soon
        const result = await this.eventService.publishDocumentEvent({
          userId: doc.userId,
          documentId: doc.id,
          documentType: doc.documentType,
          originalFileName: doc.originalFileName,
          type: 'DOCUMENT_EXPIRING',
          expiresAt: doc.expiresAt,
          daysRemaining,
        });

        if (result) expiringAlerts++;
      }
    }

    logger.info({ expiringAlerts, expiredAlerts }, 'Completed DocumentExpiryJob scan');

    return { expiringAlerts, expiredAlerts };
  }

  private calculateCalendarDaysRemaining(now: Date, targetDate: Date): number {
    const nowDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const target = new Date(
      Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate()),
    );

    const diffMs = target.getTime() - nowDate.getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
  }
}
