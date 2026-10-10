import { PrismaClient, ApplicationCycleStatus } from '@prisma/client';
import { prisma } from '../../../database/prisma.js';
import {
  NotificationEventService,
  notificationEventService,
} from '../notifications.event-service.js';
import { logger } from '../../../utils/logger.js';

export class UpcomingOpeningJob {
  private readonly thresholds = [7, 3, 1];

  constructor(
    private readonly db: PrismaClient = prisma,
    private readonly eventService: NotificationEventService = notificationEventService,
  ) {}

  public async run(now: Date = new Date()): Promise<{
    openingsNotified: number;
  }> {
    logger.info('Starting UpcomingOpeningJob scan');
    let openingsNotified = 0;

    const upcomingPeriods = await this.db.applicationPeriod.findMany({
      where: {
        status: ApplicationCycleStatus.UPCOMING,
        applicationOpenDate: { not: null },
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

    for (const period of upcomingPeriods) {
      if (!period.applicationOpenDate) continue;

      const daysRemaining = this.calculateCalendarDaysRemaining(now, period.applicationOpenDate);

      if (!this.thresholds.includes(daysRemaining) || daysRemaining < 0) {
        continue;
      }

      const schemeId = period.schemeId;
      const schemeName = period.scheme.name;
      const schemeSlug = period.scheme.slug;

      const saved = await this.db.savedScheme.findMany({
        where: { schemeId },
        select: { userId: true },
      });

      for (const item of saved) {
        const result = await this.eventService.publishUpcomingOpening({
          userId: item.userId,
          schemeId,
          schemeName,
          schemeSlug,
          openingDate: period.applicationOpenDate,
          daysRemaining,
        });

        if (result) {
          openingsNotified++;
        }
      }
    }

    logger.info({ openingsNotified }, 'Completed UpcomingOpeningJob scan');
    return { openingsNotified };
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
