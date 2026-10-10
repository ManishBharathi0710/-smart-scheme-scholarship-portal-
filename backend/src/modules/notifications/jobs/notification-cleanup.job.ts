import { NotificationRepository } from '../notifications.repository.js';
import { env } from '../../../config/env.js';
import { logger } from '../../../utils/logger.js';

export class NotificationCleanupJob {
  constructor(private readonly repository: NotificationRepository = new NotificationRepository()) {}

  public async run(now: Date = new Date()): Promise<{
    archivedExpired: number;
    softDeletedOld: number;
  }> {
    logger.info('Starting NotificationCleanupJob');

    // 1. Archive expired notifications
    const archivedExpired = await this.repository.archiveExpired(now);

    // 2. Soft-delete notifications older than retention days
    const cutoffDate = new Date(
      now.getTime() - env.NOTIFICATION_RETENTION_DAYS * 24 * 60 * 60 * 1000,
    );

    const softDeletedOld = await this.repository.softDeleteOlderThan(
      cutoffDate,
      env.NOTIFICATION_CLEANUP_BATCH_SIZE,
    );

    logger.info(
      { archivedExpired, softDeletedOld, retentionDays: env.NOTIFICATION_RETENTION_DAYS },
      'Completed NotificationCleanupJob',
    );

    return { archivedExpired, softDeletedOld };
  }
}
