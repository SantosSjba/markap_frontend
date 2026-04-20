import { apiClient } from '@core/api/apiClient'
import type {
  ListNotificationsResponse,
  NotificationItem,
  UnreadCountResponse,
} from '../../domain/notification.types'
import type { NotificationsRepository } from '../../domain/repositories/notifications.repository'

export const notificationsApiRepository: NotificationsRepository = {
  list(params?: { unreadOnly?: boolean; limit?: number; offset?: number }) {
    return apiClient
      .get<ListNotificationsResponse>('/notifications', { params })
      .then((r) => r.data)
  },

  unreadCount() {
    return apiClient.get<UnreadCountResponse>('/notifications/unread-count').then((r) => r.data)
  },

  markAsRead(id: string) {
    return apiClient.patch<NotificationItem>(`/notifications/${id}/read`).then((r) => r.data)
  },
}
