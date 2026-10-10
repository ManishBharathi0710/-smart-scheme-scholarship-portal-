import { NotificationChannel } from '@prisma/client';
import { NotificationDto, ChannelDeliveryResult } from '../notifications.types.js';

export interface ChannelDeliveryContext {
  recipientEmail?: string;
  frontendUrl?: string;
}

export interface INotificationChannel {
  readonly channelType: NotificationChannel;
  send(
    notification: NotificationDto,
    context?: ChannelDeliveryContext,
  ): Promise<ChannelDeliveryResult>;
}
