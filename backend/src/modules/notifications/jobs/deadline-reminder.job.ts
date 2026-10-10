import { PrismaClient, ApplicationCycleStatus } from '@prisma/client';
import { prisma } from '../../../database/prisma.js';
import { env } from '../../../config/env.js';
import {
  NotificationEventService,
  notificationEventService,
} from '../notifications.event-service.js';
import { logger } from '../../../utils/logger.js';

export class DeadlineReminderJob {
  private readonly thresholds: number[];

  constructor(
    private readonly db: PrismaClient = prisma,
    private readonly eventService: NotificationEventService = notificationEventService,
  ) {
    this.thresholds = env.NOTIFICATION_DEADLINE_THRESHOLDS.split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n));
  }

  public async run(now: Date = new Date()): Promise<{
    scannedUsers: number;
    remindersGenerated: number;
  }> {
    logger.info({ thresholds: this.thresholds }, 'Starting DeadlineReminderJob scan');
    let remindersGenerated = 0;

    // 1. Gather all active schemes with open application periods closing in future
    const openPeriods = await this.db.applicationPeriod.findMany({
      where: {
        status: ApplicationCycleStatus.OPEN,
        applicationCloseDate: { not: null },
      },
      include: {
        scheme: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (openPeriods.length === 0) {
      logger.info('DeadlineReminderJob: No open application periods found');
      return { scannedUsers: 0, remindersGenerated: 0 };
    }

    const uniqueUsersSet = new Set<string>();

    for (const period of openPeriods) {
      if (!period.applicationCloseDate) continue;

      const daysRemaining = this.calculateCalendarDaysRemaining(now, period.applicationCloseDate);

      // Check if daysRemaining matches any of the configured thresholds
      if (!this.thresholds.includes(daysRemaining) || daysRemaining < 0) {
        continue;
      }

      const schemeId = period.schemeId;
      const schemeName = period.scheme.name;
      const schemeSlug = period.scheme.slug;

      // 2. Find all citizens who saved this scheme
      const saved = await this.db.savedScheme.findMany({
        where: { schemeId },
        select: { userId: true },
      });

      // 3. Find all citizens who have an eligible/likely eligible recommendation
      const recs = await this.db.recommendation.findMany({
        where: {
          schemeId,
          eligibilityStatus: { in: ['ELIGIBLE', 'LIKELY_ELIGIBLE'] },
        },
        select: { userId: true },
      });

      const userIdsForScheme = new Set<string>([
        ...saved.map((s) => s.userId),
        ...recs.map((r) => r.userId),
      ]);

      for (const userId of userIdsForScheme) {
        uniqueUsersSet.add(userId);

        const result = await this.eventService.publishDeadlineReminder({
          userId,
          schemeId,
          schemeName,
          schemeSlug,
          deadlineDate: period.applicationCloseDate,
          daysRemaining,
        });

        if (result) {
          remindersGenerated++;
        }
      }
    }

    logger.info(
      { scannedUsers: uniqueUsersSet.size, remindersGenerated },
      'Completed DeadlineReminderJob scan',
    );

    return {
      scannedUsers: uniqueUsersSet.size,
      remindersGenerated,
    };
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
