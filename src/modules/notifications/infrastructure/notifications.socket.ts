import { apiServerUrl } from '@shared/config/env.config'
import type { NotificationPayload, OnNotificationCallback } from '../domain/notification.types'
import type { NotificationConnectionPort } from '../application/ports/notification-connection.port'
/**
 * Socket.IO client for real-time notifications.
 * Connects to backend /notifications namespace with JWT.
 */

let socket: unknown = null
let connectionVersion = 0

export function connectNotificationsSocket(
  accessToken: string,
  onNotification: OnNotificationCallback,
  onDisconnect: (disconnect: () => void) => void,
  onDataChanged?: (payload: { resource: string }) => void,
): void {
  disconnectNotificationsSocket()
  const version = connectionVersion
  void import('socket.io-client').then(({ io }) => {
    if (version !== connectionVersion) return
    const baseUrl = apiServerUrl
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
    const syncSocket = socket as {
      on: (event: string, callback: (payload: { resource: string }) => void) => void
    }
    syncSocket.on('data-changed', (payload) => onDataChanged?.(payload))
    syncSocket.on('authenticated', () => onDataChanged?.({ resource: '*' }))
    onDisconnect(() => {
      s.disconnect()
      socket = null
    })
  })
}

export function disconnectNotificationsSocket(): void {
  connectionVersion += 1
  if (socket && typeof (socket as { disconnect: () => void }).disconnect === 'function') {
    ;(socket as { disconnect: () => void }).disconnect()
  }
  socket = null
}

export const notificationConnectionAdapter: NotificationConnectionPort = {
  connect: connectNotificationsSocket,
  disconnect: disconnectNotificationsSocket,
}
