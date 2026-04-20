import type {
  ListNotificationsResponse,
  NotificationItem,
  UnreadCountResponse,
} from '../notification.types'

export interface NotificationsRepository {
  list(params?: { unreadOnly?: boolean; limit?: number; offset?: number }): Promise<ListNotificationsResponse>
  unreadCount(): Promise<UnreadCountResponse>
  markAsRead(id: string): Promise<NotificationItem>
}
