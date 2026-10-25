import { createServiceKey } from '@shared/application/ports/service-key'
import type { OnNotificationCallback } from '../../domain/notification.types'
export interface NotificationConnectionPort {
  connect(
    accessToken: string,
    onNotification: OnNotificationCallback,
    onDisconnect: (disconnect: () => void) => void,
    onDataChanged?: (payload: { resource: string }) => void,
  ): void
  disconnect(): void
}

export const NOTIFICATION_CONNECTION = createServiceKey<NotificationConnectionPort>(
  'notifications.connection',
)
