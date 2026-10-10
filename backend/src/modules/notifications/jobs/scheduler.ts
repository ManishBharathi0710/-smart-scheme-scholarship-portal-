import { DeadlineReminderJob } from './deadline-reminder.job.js';
import { UpcomingOpeningJob } from './upcoming-opening.job.js';
import { DocumentExpiryJob } from './document-expiry.job.js';
import { NotificationCleanupJob } from './notification-cleanup.job.js';
import { logger } from '../../../utils/logger.js';

export interface SchedulerRunResult {
  deadlineReminders: { scannedUsers: number; remindersGenerated: number };
  upcomingOpenings: { openingsNotified: number };
  documentExpiry: { expiringAlerts: number; expiredAlerts: number };
  cleanup: { archivedExpired: number; softDeletedOld: number };
}

export class NotificationScheduler {
  constructor(
    private readonly deadlineJob: DeadlineReminderJob = new DeadlineReminderJob(),
    private readonly openingJob: UpcomingOpeningJob = new UpcomingOpeningJob(),
    private readonly docExpiryJob: DocumentExpiryJob = new DocumentExpiryJob(),
    private readonly cleanupJob: NotificationCleanupJob = new NotificationCleanupJob(),
  ) {}

  public async runAll(now: Date = new Date()): Promise<SchedulerRunResult> {
    logger.info('NotificationScheduler: Executing all notification jobs');

    const [deadlineReminders, upcomingOpenings, documentExpiry, cleanup] = await Promise.all([
      this.deadlineJob.run(now),
      this.openingJob.run(now),
      this.docExpiryJob.run(now),
      this.cleanupJob.run(now),
    ]);

    return {
      deadlineReminders,
      upcomingOpenings,
      documentExpiry,
      cleanup,
    };
  }

  public async runJob(
    jobName: 'deadline' | 'opening' | 'doc_expiry' | 'cleanup' | 'all',
    now: Date = new Date(),
  ): Promise<Partial<SchedulerRunResult>> {
    switch (jobName) {
      case 'deadline':
        return { deadlineReminders: await this.deadlineJob.run(now) };
      case 'opening':
        return { upcomingOpenings: await this.openingJob.run(now) };
      case 'doc_expiry':
        return { documentExpiry: await this.docExpiryJob.run(now) };
      case 'cleanup':
        return { cleanup: await this.cleanupJob.run(now) };
      case 'all':
      default:
        return this.runAll(now);
    }
  }
}

export const notificationScheduler = new NotificationScheduler();
