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

export interface NotificationPayload {
  id: string
  type: string
  title: string
  body: string | null
  data: Record<string, unknown> | null
  createdAt: string
}

export type OnNotificationCallback = (payload: NotificationPayload) => void
