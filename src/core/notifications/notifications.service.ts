import { apiClient } from '@core/api'

export interface NotificationItem {
  id: string
  userId: string
  type: string
  title: string
  body: string | null
  data: Record<string, unknown> | null
  readAt: string | null
  createdAt: string
}

export interface ListNotificationsResponse {
  data: NotificationItem[]
  total: number
}

export interface UnreadCountResponse {
  count: number
}

export const notificationsService = {
  list(params?: { unreadOnly?: boolean; limit?: number; offset?: number }) {
    return apiClient
      .get<ListNotificationsResponse>('/notifications', { params })
      .then((r) => r.data)
  },

  unreadCount() {
    return apiClient
      .get<UnreadCountResponse>('/notifications/unread-count')
      .then((r) => r.data)
  },

  markAsRead(id: string) {
    return apiClient
      .patch<NotificationItem>(`/notifications/${id}/read`)
      .then((r) => r.data)
  },
}
