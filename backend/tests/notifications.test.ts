import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { generateAccessToken } from '../src/modules/auth/auth.utils.js';
import {
  UserRole,
  UserStatus,
  NotificationType,
  NotificationSeverity,
  NotificationChannel,
  NotificationStatus,
  ApplicationCycleStatus,
} from '@prisma/client';
import { prisma } from '../src/database/prisma.js';
import { NotificationService } from '../src/modules/notifications/notifications.service.js';
import { NotificationRepository } from '../src/modules/notifications/notifications.repository.js';
import { DeadlineReminderJob } from '../src/modules/notifications/jobs/deadline-reminder.job.js';
import { DocumentExpiryJob } from '../src/modules/notifications/jobs/document-expiry.job.js';
import { UpcomingOpeningJob } from '../src/modules/notifications/jobs/upcoming-opening.job.js';
import { NotificationCleanupJob } from '../src/modules/notifications/jobs/notification-cleanup.job.js';
import { EmailNotificationChannel } from '../src/modules/notifications/channels/email.channel.js';

describe('Module 7: Notifications & User Alerts Subsystem', () => {
  const app = createApp();

  const userAId = '11111111-1111-1111-1111-111111111111';
  const userBId = '22222222-2222-2222-2222-222222222222';
  const notificationId = '33333333-3333-3333-3333-333333333333';

  const userAToken = generateAccessToken({
    id: userAId,
    email: 'citizenA@example.gov.in',
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
  });

  const userBToken = generateAccessToken({
    id: userBId,
    email: 'citizenB@example.gov.in',
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Authentication & Security Scoping', () => {
    it('GET /api/v1/notifications requires authentication', async () => {
      const res = await request(app).get('/api/v1/notifications');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/v1/notifications/unread-count requires authentication', async () => {
      const res = await request(app).get('/api/v1/notifications/unread-count');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('PATCH /api/v1/notifications/:id/read rejects invalid UUID format', async () => {
      const res = await request(app)
        .patch('/api/v1/notifications/not-a-valid-uuid/read')
        .set('Authorization', `Bearer ${userAToken}`);
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('User A cannot mark User B notification as read (returns 404)', async () => {
      // User B's notification
      vi.spyOn(prisma.notification, 'findFirst').mockResolvedValue(null);

      const res = await request(app)
        .patch(`/api/v1/notifications/${notificationId}/read`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('User A cannot delete User B notification (returns 404)', async () => {
      vi.spyOn(prisma.notification, 'findFirst').mockResolvedValue(null);

      const res = await request(app)
        .delete(`/api/v1/notifications/${notificationId}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Notification Querying & Unread Counts', () => {
    it('GET /api/v1/notifications returns paginated notifications for authenticated user', async () => {
      const mockNotifications = [
        {
          id: notificationId,
          userId: userAId,
          type: NotificationType.SCHEME_DEADLINE_APPROACHING,
          title: 'Application deadline approaching',
          message: 'Your saved scholarship closes in 3 days.',
          severity: NotificationSeverity.IMPORTANT,
          channel: NotificationChannel.IN_APP,
          status: NotificationStatus.UNREAD,
          readAt: null,
          sentAt: new Date(),
          scheduledFor: null,
          expiresAt: null,
          entityType: 'SCHEME',
          entityId: 'scheme-1',
          actionUrl: '/schemes/test-scheme',
          metadata: { daysRemaining: 3 },
          deduplicationKey: 'deadline:userA:scheme1:3:2026-10-01',
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.spyOn(prisma.notification, 'findMany').mockResolvedValue(mockNotifications as any);
      vi.spyOn(prisma.notification, 'count')
        .mockResolvedValueOnce(1) // total
        .mockResolvedValueOnce(1); // unreadCount

      const res = await request(app)
        .get('/api/v1/notifications?page=1&limit=10&status=UNREAD')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.total).toBe(1);
      expect(res.body.data.unreadCount).toBe(1);
      expect(res.body.data.items[0].title).toBe('Application deadline approaching');
    });

    it('GET /api/v1/notifications/unread-count returns unread count', async () => {
      vi.spyOn(prisma.notification, 'count').mockResolvedValue(5);

      const res = await request(app)
        .get('/api/v1/notifications/unread-count')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.count).toBe(5);
    });
  });

  describe('Mark as Read & Soft Deletion', () => {
    it('PATCH /api/v1/notifications/:id/read marks notification as read', async () => {
      const mockNotification = {
        id: notificationId,
        userId: userAId,
        type: NotificationType.DOCUMENT_PROCESSING_COMPLETED,
        title: 'Document processing complete',
        message: 'Your document has been processed.',
        severity: NotificationSeverity.INFO,
        channel: NotificationChannel.IN_APP,
        status: NotificationStatus.UNREAD,
        readAt: null,
        sentAt: null,
        scheduledFor: null,
        expiresAt: null,
        entityType: 'DOCUMENT',
        entityId: 'doc-1',
        actionUrl: '/documents',
        metadata: null,
        deduplicationKey: null,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(prisma.notification, 'findFirst').mockResolvedValue(mockNotification as any);
      vi.spyOn(prisma.notification, 'update').mockResolvedValue({
        ...mockNotification,
        status: NotificationStatus.READ,
        readAt: new Date(),
      } as any);

      const res = await request(app)
        .patch(`/api/v1/notifications/${notificationId}/read`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(NotificationStatus.READ);
      expect(res.body.data.readAt).not.toBeNull();
    });

    it('PATCH /api/v1/notifications/read-all marks all unread as read', async () => {
      vi.spyOn(prisma.notification, 'updateMany').mockResolvedValue({ count: 4 } as any);

      const res = await request(app)
        .patch('/api/v1/notifications/read-all')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.count).toBe(4);
    });

    it('DELETE /api/v1/notifications/:id performs soft delete', async () => {
      const mockNotification = {
        id: notificationId,
        userId: userAId,
        type: NotificationType.SCHEME_UPDATED,
        title: 'Saved scheme updated',
        message: 'Info updated',
        severity: NotificationSeverity.INFO,
        channel: NotificationChannel.IN_APP,
        status: NotificationStatus.READ,
        readAt: new Date(),
        sentAt: null,
        scheduledFor: null,
        expiresAt: null,
        entityType: 'SCHEME',
        entityId: 'scheme-1',
        actionUrl: null,
        metadata: null,
        deduplicationKey: null,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(prisma.notification, 'findFirst').mockResolvedValue(mockNotification as any);
      const updateSpy = vi.spyOn(prisma.notification, 'update').mockResolvedValue({
        ...mockNotification,
        deletedAt: new Date(),
      } as any);

      const res = await request(app)
        .delete(`/api/v1/notifications/${notificationId}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(updateSpy).toHaveBeenCalledWith({
        where: { id: notificationId },
        data: expect.objectContaining({ deletedAt: expect.any(Date) }),
      });
    });
  });

  describe('Notification Preferences & Suppression', () => {
    it('GET /api/v1/notification-preferences returns user preferences', async () => {
      const mockPrefs = {
        id: 'pref-1',
        userId: userAId,
        deadlineReminders: true,
        schemeUpdates: true,
        recommendationUpdates: true,
        documentAlerts: true,
        emailEnabled: true,
        inAppEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(prisma.notificationPreference, 'findUnique').mockResolvedValue(mockPrefs as any);

      const res = await request(app)
        .get('/api/v1/notification-preferences')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.deadlineReminders).toBe(true);
    });

    it('PATCH /api/v1/notification-preferences updates preferences', async () => {
      const updatedPrefs = {
        id: 'pref-1',
        userId: userAId,
        deadlineReminders: false,
        schemeUpdates: true,
        recommendationUpdates: true,
        documentAlerts: true,
        emailEnabled: false,
        inAppEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(prisma.notificationPreference, 'upsert').mockResolvedValue(updatedPrefs as any);

      const res = await request(app)
        .patch('/api/v1/notification-preferences')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ deadlineReminders: false, emailEnabled: false });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.deadlineReminders).toBe(false);
      expect(res.body.data.emailEnabled).toBe(false);
    });

    it('Suppresses deadline reminders when user disabled deadlineReminders', async () => {
      const repo = new NotificationRepository(prisma);
      const service = new NotificationService(repo);

      vi.spyOn(repo, 'getPreferences').mockResolvedValue({
        id: 'pref-1',
        userId: userAId,
        deadlineReminders: false,
        schemeUpdates: true,
        recommendationUpdates: true,
        documentAlerts: true,
        emailEnabled: true,
        inAppEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const createSpy = vi.spyOn(repo, 'create');

      const result = await service.createNotification({
        userId: userAId,
        type: NotificationType.SCHEME_DEADLINE_APPROACHING,
        title: 'Deadline reminder',
        message: 'Scheme closing soon',
      });

      expect(result).toBeNull();
      expect(createSpy).not.toHaveBeenCalled();
    });

    it('Never suppresses SECURITY_ALERT even if channels/preferences are disabled', async () => {
      const repo = new NotificationRepository(prisma);
      const service = new NotificationService(repo);

      vi.spyOn(repo, 'getPreferences').mockResolvedValue({
        id: 'pref-1',
        userId: userAId,
        deadlineReminders: false,
        schemeUpdates: false,
        recommendationUpdates: false,
        documentAlerts: false,
        emailEnabled: false,
        inAppEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.spyOn(repo, 'create').mockResolvedValue({
        id: 'sec-alert-1',
        userId: userAId,
        type: NotificationType.SECURITY_ALERT,
        title: 'Security Alert: Password changed',
        message: 'Your account password was updated.',
        severity: NotificationSeverity.WARNING,
        channel: NotificationChannel.IN_APP,
        status: NotificationStatus.UNREAD,
        readAt: null,
        sentAt: null,
        scheduledFor: null,
        expiresAt: null,
        entityType: null,
        entityId: null,
        actionUrl: null,
        metadata: null,
        deduplicationKey: null,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const result = await service.createNotification({
        userId: userAId,
        type: NotificationType.SECURITY_ALERT,
        title: 'Security Alert: Password changed',
        message: 'Your account password was updated.',
        severity: NotificationSeverity.WARNING,
      });

      expect(result).not.toBeNull();
      expect(result?.title).toBe('Security Alert: Password changed');
    });
  });

  describe('Deduplication & Idempotency', () => {
    it('Prevents duplicate notification when deduplicationKey matches existing record', async () => {
      const repo = new NotificationRepository(prisma);
      const service = new NotificationService(repo);

      const existingRecord = {
        id: 'existing-id',
        userId: userAId,
        type: NotificationType.SCHEME_DEADLINE_APPROACHING,
        title: 'Deadline reminder',
        message: 'Scheme closing in 3 days',
        severity: NotificationSeverity.IMPORTANT,
        channel: NotificationChannel.IN_APP,
        status: NotificationStatus.UNREAD,
        readAt: null,
        sentAt: null,
        scheduledFor: null,
        expiresAt: null,
        entityType: 'SCHEME',
        entityId: 'scheme-1',
        actionUrl: null,
        metadata: null,
        deduplicationKey: 'deadline:userA:scheme1:3:2026-10-01',
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(repo, 'getPreferences').mockResolvedValue({
        id: 'pref-1',
        userId: userAId,
        deadlineReminders: true,
        schemeUpdates: true,
        recommendationUpdates: true,
        documentAlerts: true,
        emailEnabled: true,
        inAppEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.spyOn(repo, 'findByDeduplicationKey').mockResolvedValue(existingRecord as any);
      const createSpy = vi.spyOn(repo, 'create');

      const result = await service.createNotification({
        userId: userAId,
        type: NotificationType.SCHEME_DEADLINE_APPROACHING,
        title: 'Deadline reminder',
        message: 'Scheme closing in 3 days',
        deduplicationKey: 'deadline:userA:scheme1:3:2026-10-01',
      });

      expect(result?.id).toBe('existing-id');
      expect(createSpy).not.toHaveBeenCalled();
    });
  });

  describe('Scheduled Jobs & Idempotent Scanning', () => {
    it('DeadlineReminderJob generates reminders for schemes closing in 3 days and is idempotent', async () => {
      const now = new Date('2026-10-01T10:00:00Z');
      const closeDate = new Date('2026-10-04T10:00:00Z'); // exactly 3 days remaining

      const openPeriods = [
        {
          id: 'period-1',
          schemeId: 'scheme-1',
          status: ApplicationCycleStatus.OPEN,
          applicationCloseDate: closeDate,
          scheme: {
            id: 'scheme-1',
            name: 'State Merit Scholarship',
            slug: 'state-merit-scholarship',
          },
        },
      ];

      vi.spyOn(prisma.applicationPeriod, 'findMany').mockResolvedValue(openPeriods as any);
      vi.spyOn(prisma.savedScheme, 'findMany').mockResolvedValue([{ userId: userAId }] as any);
      vi.spyOn(prisma.recommendation, 'findMany').mockResolvedValue([]);
      vi.spyOn(prisma.notificationPreference, 'findUnique').mockResolvedValue({
        id: 'pref-1',
        userId: userAId,
        deadlineReminders: true,
        schemeUpdates: true,
        recommendationUpdates: true,
        documentAlerts: true,
        emailEnabled: false,
        inAppEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // First run: no existing notification with deduplication key
      vi.spyOn(prisma.notification, 'findFirst').mockResolvedValueOnce(null);
      const createSpy = vi.spyOn(prisma.notification, 'create').mockResolvedValue({
        id: 'notif-1',
        userId: userAId,
        type: NotificationType.SCHEME_DEADLINE_APPROACHING,
        title: 'Application deadline approaching',
        message: 'Closes in 3 days',
        severity: NotificationSeverity.IMPORTANT,
        channel: NotificationChannel.IN_APP,
        status: NotificationStatus.UNREAD,
        readAt: null,
        sentAt: null,
        scheduledFor: null,
        expiresAt: null,
        entityType: 'SCHEME',
        entityId: 'scheme-1',
        actionUrl: '/schemes/state-merit-scholarship',
        metadata: null,
        deduplicationKey: `deadline:${userAId}:scheme-1:3:2026-10-04`,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const job = new DeadlineReminderJob(prisma);
      const firstRun = await job.run(now);
      expect(firstRun.remindersGenerated).toBe(1);
      expect(createSpy).toHaveBeenCalledTimes(1);

      // Second run: existing record found for deduplication key -> skips creation!
      vi.spyOn(prisma.notification, 'findFirst').mockResolvedValue({
        id: 'notif-1',
        deduplicationKey: `deadline:${userAId}:scheme-1:3:2026-10-04`,
      } as any);

      const secondRun = await job.run(now);
      // create should NOT be called again
      expect(createSpy).toHaveBeenCalledTimes(1);
      expect(secondRun.scannedUsers).toBe(1);
    });

    it('DocumentExpiryJob detects expiring and expired documents', async () => {
      const now = new Date('2026-10-01T10:00:00Z');
      const expiringDate = new Date('2026-10-16T10:00:00Z'); // 15 days
      const expiredDate = new Date('2026-09-20T10:00:00Z'); // -11 days (expired)

      vi.spyOn(prisma.userDocument, 'findMany').mockResolvedValue([
        {
          id: 'doc-1',
          userId: userAId,
          documentType: 'INCOME_CERTIFICATE',
          originalFileName: 'income_cert.pdf',
          expiresAt: expiringDate,
          isCurrent: true,
          deletedAt: null,
        },
        {
          id: 'doc-2',
          userId: userBId,
          documentType: 'COMMUNITY_CERTIFICATE',
          originalFileName: 'caste_cert.pdf',
          expiresAt: expiredDate,
          isCurrent: true,
          deletedAt: null,
        },
      ] as any);

      vi.spyOn(prisma.notificationPreference, 'findUnique').mockResolvedValue({
        id: 'pref-1',
        userId: userAId,
        deadlineReminders: true,
        schemeUpdates: true,
        recommendationUpdates: true,
        documentAlerts: true,
        emailEnabled: false,
        inAppEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.spyOn(prisma.notification, 'findFirst').mockResolvedValue(null);
      vi.spyOn(prisma.notification, 'create').mockResolvedValue({
        id: 'doc-notif-1',
        userId: userAId,
        type: NotificationType.DOCUMENT_EXPIRING,
        title: 'Document expiring soon',
        message: 'Expires in 15 days',
        severity: NotificationSeverity.IMPORTANT,
        channel: NotificationChannel.IN_APP,
        status: NotificationStatus.UNREAD,
        readAt: null,
        sentAt: null,
        scheduledFor: null,
        expiresAt: null,
        entityType: 'DOCUMENT',
        entityId: 'doc-1',
        actionUrl: '/documents',
        metadata: null,
        deduplicationKey: `doc_expiring:${userAId}:doc-1:15`,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const job = new DocumentExpiryJob(prisma);
      const result = await job.run(now);

      expect(result.expiringAlerts).toBe(1);
      expect(result.expiredAlerts).toBe(1);
    });

    it('UpcomingOpeningJob detects schemes opening in configured thresholds', async () => {
      const now = new Date('2026-10-01T10:00:00Z');
      const openDate = new Date('2026-10-08T10:00:00Z'); // 7 days

      vi.spyOn(prisma.applicationPeriod, 'findMany').mockResolvedValue([
        {
          id: 'period-upcoming',
          schemeId: 'scheme-2',
          status: ApplicationCycleStatus.UPCOMING,
          applicationOpenDate: openDate,
          scheme: {
            id: 'scheme-2',
            name: 'Post-Matric Scholarship',
            slug: 'post-matric-scholarship',
          },
        },
      ] as any);

      vi.spyOn(prisma.savedScheme, 'findMany').mockResolvedValue([{ userId: userAId }] as any);
      vi.spyOn(prisma.notificationPreference, 'findUnique').mockResolvedValue({
        id: 'pref-1',
        userId: userAId,
        deadlineReminders: true,
        schemeUpdates: true,
        recommendationUpdates: true,
        documentAlerts: true,
        emailEnabled: false,
        inAppEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      vi.spyOn(prisma.notification, 'findFirst').mockResolvedValue(null);
      vi.spyOn(prisma.notification, 'create').mockResolvedValue({
        id: 'open-notif-1',
        userId: userAId,
        type: NotificationType.SCHEME_OPENING_SOON,
        title: 'Application opening soon',
        message: 'Opens in 7 days',
        severity: NotificationSeverity.INFO,
        channel: NotificationChannel.IN_APP,
        status: NotificationStatus.UNREAD,
        readAt: null,
        sentAt: null,
        scheduledFor: null,
        expiresAt: null,
        entityType: 'SCHEME',
        entityId: 'scheme-2',
        actionUrl: '/schemes/post-matric-scholarship',
        metadata: null,
        deduplicationKey: `opening:${userAId}:scheme-2:7:2026-10-08`,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const job = new UpcomingOpeningJob(prisma);
      const result = await job.run(now);
      expect(result.openingsNotified).toBe(1);
    });

    it('NotificationCleanupJob archives expired and soft-deletes old notifications', async () => {
      const repo = new NotificationRepository(prisma);
      vi.spyOn(repo, 'archiveExpired').mockResolvedValue(3);
      vi.spyOn(repo, 'softDeleteOlderThan').mockResolvedValue(8);

      const job = new NotificationCleanupJob(repo);
      const result = await job.run(new Date());

      expect(result.archivedExpired).toBe(3);
      expect(result.softDeletedOld).toBe(8);
    });
  });

  describe('Email Channel Abstraction & Bounded Retries', () => {
    class FailingEmailChannel extends EmailNotificationChannel {
      public deliverAttempts = 0;

      protected override async deliverEmail(): Promise<void> {
        this.deliverAttempts++;
        throw new Error('Simulated SMTP Network Failure');
      }
    }

    it('Retries bounded number of times and reports failure gracefully without throwing', async () => {
      const channel = new FailingEmailChannel();

      const result = await channel.send(
        {
          id: 'test-email-notif',
          userId: userAId,
          type: NotificationType.SCHEME_DEADLINE_APPROACHING,
          title: 'Deadline reminder',
          message: 'Scholarship closes in 3 days',
          severity: NotificationSeverity.IMPORTANT,
          channel: NotificationChannel.EMAIL,
          status: NotificationStatus.UNREAD,
          readAt: null,
          sentAt: null,
          scheduledFor: null,
          expiresAt: null,
          entityType: 'SCHEME',
          entityId: 'scheme-1',
          actionUrl: '/schemes/test',
          metadata: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        { recipientEmail: 'citizen@example.gov.in' },
      );

      expect(channel.deliverAttempts).toBe(3); // bounded to env.NOTIFICATION_MAX_EMAIL_RETRIES (3)
      expect(result.success).toBe(false);
      expect(result.error).toContain('Simulated SMTP Network Failure');
    });
  });
});
