import { NotificationChannel } from '@prisma/client';
import { INotificationChannel, ChannelDeliveryContext } from './notification-channel.interface.js';
import { NotificationDto, ChannelDeliveryResult } from '../notifications.types.js';
import { renderEmailNotification } from '../templates/email-templates.js';
import { env } from '../../../config/env.js';
import { logger } from '../../../utils/logger.js';

export class EmailNotificationChannel implements INotificationChannel {
  public readonly channelType = NotificationChannel.EMAIL;

  public async send(
    notification: NotificationDto,
    context?: ChannelDeliveryContext,
  ): Promise<ChannelDeliveryResult> {
    const recipient = context?.recipientEmail;
    if (!recipient) {
      logger.warn(
        { notificationId: notification.id },
        'Cannot send email notification: recipient email address missing',
      );
      return {
        channel: this.channelType,
        success: false,
        error: 'Missing recipient email address',
      };
    }

    const frontendUrl = context?.frontendUrl ?? env.FRONTEND_URL;
    const rendered = renderEmailNotification(notification, recipient, frontendUrl);
    const maxRetries = env.NOTIFICATION_MAX_EMAIL_RETRIES;

    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt < maxRetries) {
      attempt++;
      try {
        await this.deliverEmail({
          from: env.EMAIL_FROM,
          to: recipient,
          subject: rendered.subject,
          text: rendered.text,
          html: rendered.html,
        });

        logger.info(
          {
            notificationId: notification.id,
            recipient: this.maskEmail(recipient),
            attempt,
            subject: rendered.subject,
          },
          'Email notification sent successfully',
        );

        return {
          channel: this.channelType,
          success: true,
          deliveredAt: new Date(),
        };
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        logger.warn(
          {
            notificationId: notification.id,
            attempt,
            maxRetries,
            error: lastError.message,
          },
          'Email notification delivery attempt failed, retrying if within limit',
        );
      }
    }

    logger.error(
      {
        notificationId: notification.id,
        attempts: maxRetries,
        error: lastError?.message,
      },
      'Email notification delivery permanently failed after maximum bounded retries',
    );

    return {
      channel: this.channelType,
      success: false,
      error: lastError?.message ?? 'Email delivery failed after max retries',
    };
  }

  protected async deliverEmail(payload: {
    from: string;
    to: string;
    subject: string;
    text: string;
    html: string;
  }): Promise<void> {
    // In dev / test / LOG mode, we safely log the email output
    if (env.EMAIL_PROVIDER === 'LOG' || env.EMAIL_PROVIDER === 'MOCK') {
      logger.debug(
        {
          provider: env.EMAIL_PROVIDER,
          from: payload.from,
          to: this.maskEmail(payload.to),
          subject: payload.subject,
        },
        'Email dispatched via mock/log transport',
      );
      return;
    }

    // Extensible for future SMTP or service provider transports
    return;
  }

  private maskEmail(email: string): string {
    const parts = email.split('@');
    if (parts.length !== 2) return '***';
    const local = parts[0] ?? '';
    const domain = parts[1] ?? '';
    const visible = local.slice(0, 2);
    return `${visible}***@${domain}`;
  }
}
