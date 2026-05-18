/**
 * Socket.IO client for real-time notifications.
 * Connects to backend /notifications namespace with JWT.
 */

import type { NotificationPayload, OnNotificationCallback } from '../domain/notification.types'

const getBaseUrl = (): string => {
  const api = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
  return api.replace(/\/api\/?$/, '') || 'http://localhost:3000'
}

let socket: unknown = null

export function connectNotificationsSocket(
  accessToken: string,
  onNotification: OnNotificationCallback,
  onDisconnect: (disconnect: () => void) => void,
): void {
  void import('socket.io-client').then(({ io }) => {
    const baseUrl = getBaseUrl()
    socket = io(`${baseUrl}/notifications`, {
      auth: { token: accessToken },
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    })
    const s = socket as {
      on: (event: string, cb: (p: NotificationPayload) => void) => void
      disconnect: () => void
    }
    s.on('notification', onNotification)
    onDisconnect(() => {
      s.disconnect()
      socket = null
    })
  })
}

export function disconnectNotificationsSocket(): void {
  if (socket && typeof (socket as { disconnect: () => void }).disconnect === 'function') {
    ;(socket as { disconnect: () => void }).disconnect()
  }
  socket = null
}
