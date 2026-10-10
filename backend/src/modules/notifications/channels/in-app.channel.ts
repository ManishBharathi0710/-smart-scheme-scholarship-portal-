import { NotificationChannel } from '@prisma/client';
import { INotificationChannel, ChannelDeliveryContext } from './notification-channel.interface.js';
import { NotificationDto, ChannelDeliveryResult } from '../notifications.types.js';

export class InAppNotificationChannel implements INotificationChannel {
  public readonly channelType = NotificationChannel.IN_APP;

  public async send(
    _notification: NotificationDto,
    _context?: ChannelDeliveryContext,
  ): Promise<ChannelDeliveryResult> {
    // In-app notifications are stored directly in PostgreSQL database
    return {
      channel: this.channelType,
      success: true,
      deliveredAt: new Date(),
    };
  }
}
