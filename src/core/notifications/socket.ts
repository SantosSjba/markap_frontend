/**
 * Socket.IO client for real-time notifications.
 * Connects to backend /notifications namespace with JWT.
 */

const getBaseUrl = (): string => {
  const api = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
  return api.replace(/\/api\/?$/, '') || 'http://localhost:3000'
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

let socket: unknown = null

/**
 * Connect to notifications namespace. Calls onDisconnect with the disconnect function once connected.
 */
export function connectNotificationsSocket(
  accessToken: string,
  onNotification: OnNotificationCallback,
  onDisconnect: (disconnect: () => void) => void
): void {
  import('socket.io-client').then(({ io }) => {
    const baseUrl = getBaseUrl()
    socket = io(`${baseUrl}/notifications`, {
      auth: { token: accessToken },
      path: '/socket.io',
      transports: ['websocket', 'polling'],
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
    (socket as { disconnect: () => void }).disconnect()
  }
  socket = null
}
