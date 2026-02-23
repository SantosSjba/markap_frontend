import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '@modules/auth/stores/auth.store'
import {
  notificationsService,
  type NotificationItem,
} from '@core/notifications/notifications.service'
import {
  connectNotificationsSocket,
  disconnectNotificationsSocket,
  type NotificationPayload,
} from '@core/notifications/socket'

export const useNotificationsStore = defineStore('notifications', () => {
  const authStore = useAuthStore()

  const list = ref<NotificationItem[]>([])
  const total = ref(0)
  const unreadCount = ref(0)
  const isLoading = ref(false)
  const isDropdownOpen = ref(false)
  let disconnectSocket: (() => void) | null = null

  const hasUnread = computed(() => unreadCount.value > 0)

  function showBrowserNotification(payload: NotificationPayload) {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission !== 'granted') return
    try {
      const n = new Notification(payload.title, {
        body: payload.body ?? undefined,
        icon: '/favicon.ico',
        tag: payload.id,
      })
      n.onclick = () => {
        window.focus()
        if (payload.data?.rentalId && payload.data?.applicationSlug) {
          const slug = payload.data.applicationSlug as string
          const id = payload.data.rentalId as string
          window.location.href = `/${slug}/contratos/${id}`
        }
        n.close()
      }
    } catch {
      // ignore
    }
  }

  function requestBrowserPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return Promise.resolve('denied')
    }
    if (Notification.permission === 'granted') return Promise.resolve('granted')
    if (Notification.permission === 'denied') return Promise.resolve('denied')
    return Notification.requestPermission()
  }

  function pushFromSocket(payload: NotificationPayload) {
    const item: NotificationItem = {
      id: payload.id,
      userId: '',
      type: payload.type,
      title: payload.title,
      body: payload.body,
      data: payload.data,
      readAt: null,
      createdAt: payload.createdAt,
    }
    list.value = [item, ...list.value]
    total.value += 1
    unreadCount.value += 1
    showBrowserNotification(payload)
  }

  async function fetchList(unreadOnly = false) {
    if (!authStore.accessToken) return
    isLoading.value = true
    try {
      const res = await notificationsService.list({
        unreadOnly,
        limit: 30,
        offset: 0,
      })
      list.value = res.data
      total.value = res.total
    } catch {
      list.value = []
      total.value = 0
    } finally {
      isLoading.value = false
    }
  }

  async function fetchUnreadCount() {
    if (!authStore.accessToken) return
    try {
      const res = await notificationsService.unreadCount()
      unreadCount.value = res.count
    } catch {
      unreadCount.value = 0
    }
  }

  async function markAsRead(id: string) {
    try {
      await notificationsService.markAsRead(id)
      const item = list.value.find((n) => n.id === id)
      if (item) item.readAt = new Date().toISOString()
      if (unreadCount.value > 0) unreadCount.value -= 1
    } catch {
      // ignore
    }
  }

  function connectSocket() {
    const token = authStore.accessToken
    if (!token) return
    connectNotificationsSocket(token, pushFromSocket, (disconnect) => {
      disconnectSocket = disconnect
    })
  }

  function disconnect() {
    if (disconnectSocket) {
      disconnectSocket()
      disconnectSocket = null
    }
    disconnectNotificationsSocket()
    list.value = []
    total.value = 0
    unreadCount.value = 0
  }

  watch(
    () => authStore.accessToken,
    (token) => {
      if (token) {
        connectSocket()
        fetchList()
        fetchUnreadCount()
      } else {
        disconnect()
      }
    },
    { immediate: true }
  )

  return {
    list,
    total,
    unreadCount,
    isLoading,
    isDropdownOpen,
    hasUnread,
    requestBrowserPermission,
    fetchList,
    fetchUnreadCount,
    markAsRead,
    pushFromSocket,
    connectSocket,
    disconnect,
  }
})
