import { NotificationType, NotificationSeverity } from '@prisma/client';
import { NotificationService } from './notifications.service.js';
import { DocumentEventPayload, RecommendationEventPayload } from './notifications.types.js';

export interface DeadlineEventPayload {
  userId: string;
  schemeId: string;
  schemeName: string;
  schemeSlug: string;
  deadlineDate: Date;
  daysRemaining: number;
}

export interface OpeningEventPayload {
  userId: string;
  schemeId: string;
  schemeName: string;
  schemeSlug: string;
  openingDate: Date;
  daysRemaining: number;
}

export interface SchemeUpdatedEventPayload {
  userId: string;
  schemeId: string;
  schemeName: string;
  schemeSlug: string;
  changeSummary: string;
  versionNumber: number;
}

export class NotificationEventService {
  constructor(
    private readonly notificationService: NotificationService = new NotificationService(),
  ) {}

  public async publishDeadlineReminder(payload: DeadlineEventPayload) {
    const isToday = payload.daysRemaining === 0;
    const title = isToday ? 'Application deadline today' : 'Application deadline approaching';

    const message = isToday
      ? `The application period for "${payload.schemeName}" closes today.`
      : `The application period for "${payload.schemeName}" closes in ${payload.daysRemaining} day${
          payload.daysRemaining > 1 ? 's' : ''
        }.`;

    const severity =
      payload.daysRemaining <= 1 ? NotificationSeverity.IMPORTANT : NotificationSeverity.INFO;

    const dateKey = payload.deadlineDate.toISOString().slice(0, 10);
    const deduplicationKey = `deadline:${payload.userId}:${payload.schemeId}:${payload.daysRemaining}:${dateKey}`;

    return this.notificationService.createNotification({
      userId: payload.userId,
      type: isToday
        ? NotificationType.SCHEME_DEADLINE_TODAY
        : NotificationType.SCHEME_DEADLINE_APPROACHING,
      title,
      message,
      severity,
      entityType: 'SCHEME',
      entityId: payload.schemeId,
      actionUrl: `/schemes/${payload.schemeSlug || payload.schemeId}`,
      deduplicationKey,
      metadata: {
        schemeId: payload.schemeId,
        daysRemaining: payload.daysRemaining,
        deadlineDate: payload.deadlineDate.toISOString(),
      },
    });
  }

  public async publishUpcomingOpening(payload: OpeningEventPayload) {
    const title = 'Application opening soon';
    const message = `Applications for "${payload.schemeName}" open in ${payload.daysRemaining} day${
      payload.daysRemaining > 1 ? 's' : ''
    }.`;

    const dateKey = payload.openingDate.toISOString().slice(0, 10);
    const deduplicationKey = `opening:${payload.userId}:${payload.schemeId}:${payload.daysRemaining}:${dateKey}`;

    return this.notificationService.createNotification({
      userId: payload.userId,
      type: NotificationType.SCHEME_OPENING_SOON,
      title,
      message,
      severity: NotificationSeverity.INFO,
      entityType: 'SCHEME',
      entityId: payload.schemeId,
      actionUrl: `/schemes/${payload.schemeSlug || payload.schemeId}`,
      deduplicationKey,
      metadata: {
        schemeId: payload.schemeId,
        daysRemaining: payload.daysRemaining,
        openingDate: payload.openingDate.toISOString(),
      },
    });
  }

  public async publishSchemeUpdated(payload: SchemeUpdatedEventPayload) {
    const title = 'Saved scheme updated';
    const message = `Important information for "${payload.schemeName}" has changed: ${payload.changeSummary}`;
    const deduplicationKey = `scheme_updated:${payload.userId}:${payload.schemeId}:v${payload.versionNumber}`;

    return this.notificationService.createNotification({
      userId: payload.userId,
      type: NotificationType.SCHEME_UPDATED,
      title,
      message,
      severity: NotificationSeverity.INFO,
      entityType: 'SCHEME',
      entityId: payload.schemeId,
      actionUrl: `/schemes/${payload.schemeSlug || payload.schemeId}`,
      deduplicationKey,
      metadata: {
        schemeId: payload.schemeId,
        versionNumber: payload.versionNumber,
      },
    });
  }

  public async publishSchemeClosed(payload: {
    userId: string;
    schemeId: string;
    schemeName: string;
    schemeSlug: string;
  }) {
    const title = 'Application period closed';
    const message = `The application period for "${payload.schemeName}" has closed.`;
    const deduplicationKey = `scheme_closed:${payload.userId}:${payload.schemeId}`;

    return this.notificationService.createNotification({
      userId: payload.userId,
      type: NotificationType.SCHEME_CLOSED,
      title,
      message,
      severity: NotificationSeverity.INFO,
      entityType: 'SCHEME',
      entityId: payload.schemeId,
      actionUrl: `/schemes/${payload.schemeSlug || payload.schemeId}`,
      deduplicationKey,
      metadata: {
        schemeId: payload.schemeId,
      },
    });
  }

  public async publishRecommendationEvent(event: RecommendationEventPayload) {
    let title: string;
    let message: string;
    let type: NotificationType;
    let severity: NotificationSeverity = NotificationSeverity.INFO;

    switch (event.type) {
      case 'RECOMMENDATION_AVAILABLE':
        type = NotificationType.RECOMMENDATION_AVAILABLE;
        title = 'New scheme recommendations';
        message = 'You have new verified scheme recommendations matching your profile.';
        break;
      case 'RECOMMENDATION_CHANGED':
        type = NotificationType.RECOMMENDATION_CHANGED;
        title = 'Your recommendation was updated';
        message = `Your recommendation for "${event.schemeName}" has changed after your profile information was updated.`;
        break;
      case 'PROFILE_INFORMATION_NEEDED':
        type = NotificationType.PROFILE_INFORMATION_NEEDED;
        title = 'More information may be needed';
        message = 'Your profile is missing information required to fully assess some schemes.';
        severity = NotificationSeverity.IMPORTANT;
        break;
      default:
        type = NotificationType.RECOMMENDATION_AVAILABLE;
        title = 'Recommendation update';
        message = 'Your recommendations have been updated.';
    }

    const deduplicationKey = `rec:${event.userId}:${event.schemeId}:${type}`;

    return this.notificationService.createNotification({
      userId: event.userId,
      type,
      title,
      message,
      severity,
      entityType: 'RECOMMENDATION',
      entityId: event.schemeId,
      actionUrl: '/recommendations',
      deduplicationKey,
      metadata: {
        schemeId: event.schemeId,
        reason: event.reason,
      },
    });
  }

  public async publishDocumentEvent(event: DocumentEventPayload) {
    let title: string;
    let message: string;
    let type: NotificationType;
    let severity: NotificationSeverity = NotificationSeverity.INFO;
    let deduplicationKey: string | undefined;

    switch (event.type) {
      case 'DOCUMENT_PROCESSING_COMPLETED':
        type = NotificationType.DOCUMENT_PROCESSING_COMPLETED;
        title = 'Document processing complete';
        message = `Your document "${event.originalFileName}" has been processed. Please review the extracted information.`;
        deduplicationKey = `doc_proc_done:${event.userId}:${event.documentId}`;
        break;

      case 'DOCUMENT_PROCESSING_FAILED':
        type = NotificationType.DOCUMENT_PROCESSING_FAILED;
        title = 'Document processing failed';
        message = `We couldn't process your uploaded document "${event.originalFileName}". Please review it or upload a clearer copy.`;
        severity = NotificationSeverity.IMPORTANT;
        deduplicationKey = `doc_proc_failed:${event.userId}:${event.documentId}`;
        break;

      case 'DOCUMENT_REVIEW_REQUIRED':
        type = NotificationType.DOCUMENT_REVIEW_REQUIRED;
        title = 'Document review required';
        message = `Your document "${event.originalFileName}" requires review before it can be verified for schemes.`;
        severity = NotificationSeverity.IMPORTANT;
        deduplicationKey = `doc_review:${event.userId}:${event.documentId}`;
        break;

      case 'DOCUMENT_EXPIRING':
        type = NotificationType.DOCUMENT_EXPIRING;
        title = 'Document expiring soon';
        message = `Your document "${event.originalFileName}" expires in ${event.daysRemaining ?? 15} days.`;
        severity = NotificationSeverity.IMPORTANT;
        deduplicationKey = `doc_expiring:${event.userId}:${event.documentId}:${event.daysRemaining}`;
        break;

      case 'DOCUMENT_EXPIRED':
        type = NotificationType.DOCUMENT_EXPIRED;
        title = 'Document expired';
        message = `Your document "${event.originalFileName}" has expired. You may need an updated document for schemes that require it.`;
        severity = NotificationSeverity.WARNING;
        deduplicationKey = `doc_expired:${event.userId}:${event.documentId}`;
        break;

      default:
        return null;
    }

    return this.notificationService.createNotification({
      userId: event.userId,
      type,
      title,
      message,
      severity,
      entityType: 'DOCUMENT',
      entityId: event.documentId,
      actionUrl: '/documents',
      deduplicationKey,
      metadata: {
        documentId: event.documentId,
        documentType: event.documentType,
        originalFileName: event.originalFileName,
        expiresAt: event.expiresAt ? event.expiresAt.toISOString() : undefined,
      },
    });
  }
}

export const notificationEventService = new NotificationEventService();
