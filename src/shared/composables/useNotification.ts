import { ref, type Ref } from 'vue'

/**
 * useNotification Composable
 * Manages toast/notification messages
 */

export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message?: string
  duration?: number
}

interface UseNotificationReturn {
  notifications: Ref<Notification[]>
  add: (notification: Omit<Notification, 'id'>) => string
  remove: (id: string) => void
  success: (title: string, message?: string) => string
  error: (title: string, message?: string) => string
  warning: (title: string, message?: string) => string
  info: (title: string, message?: string) => string
  clear: () => void
}

const notifications = ref<Notification[]>([])

export function useNotification(): UseNotificationReturn {
  const generateId = () => Math.random().toString(36).substr(2, 9)

  const add = (notification: Omit<Notification, 'id'>): string => {
    const id = generateId()
    const { duration = 5000 } = notification

    notifications.value.push({
      ...notification,
      id,
    })

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => remove(id), duration)
    }

    return id
  }

  const remove = (id: string) => {
    const index = notifications.value.findIndex((n) => n.id === id)
    if (index !== -1) {
      notifications.value.splice(index, 1)
    }
  }

  const success = (title: string, message?: string) => {
    return add({ type: 'success', title, message })
  }

  const error = (title: string, message?: string) => {
    return add({ type: 'error', title, message, duration: 8000 })
  }

  const warning = (title: string, message?: string) => {
    return add({ type: 'warning', title, message })
  }

  const info = (title: string, message?: string) => {
    return add({ type: 'info', title, message })
  }

  const clear = () => {
    notifications.value = []
  }

  return {
    notifications,
    add,
    remove,
    success,
    error,
    warning,
    info,
    clear,
  }
}
