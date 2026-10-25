import { defineStore } from 'pinia'
import { queryClient } from '@shared/infrastructure/query/vue-query'
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '@modules/auth/presentation/stores/auth.store'
import { notificationsRepositoryKey as NOTIFICATIONS } from '../../application/ports/notifications.port'
import { useService } from '@shared/presentation/di/services'
import type { NotificationItem, NotificationPayload } from '../../domain/notification.types'
import { NOTIFICATION_CONNECTION } from '../../application/ports/notification-connection.port'
export const useNotificationsStore = defineStore('notifications', () => {
  const notificationsApiRepository = useService(NOTIFICATIONS)
  const notificationConnectionAdapter = useService(NOTIFICATION_CONNECTION)
  const authStore = useAuthStore()

  const list = ref<NotificationItem[]>([])
  const total = ref(0)
  const unreadCount = ref(0)
  const isLoading = ref(false)
  const isDropdownOpen = ref(false)
  let syncTimer: ReturnType<typeof setTimeout> | null = null
  let refreshAccess = false
  let refreshNotifications = false
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
    if (list.value.some((item) => item.id === payload.id)) return
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
    const token = authStore.accessToken
    if (!token) return
    isLoading.value = true
    try {
      const res = await notificationsApiRepository.list({
        unreadOnly,
        limit: 30,
        offset: 0,
      })
      if (authStore.accessToken !== token) return
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
    const token = authStore.accessToken
    if (!token) return
    try {
      const res = await notificationsApiRepository.unreadCount()
      if (authStore.accessToken !== token) return
      unreadCount.value = res.count
    } catch {
      unreadCount.value = 0
    }
  }

  async function markAsRead(id: string) {
    try {
      await notificationsApiRepository.markAsRead(id)
      const item = list.value.find((n) => n.id === id)
      if (item && !item.readAt) {
        item.readAt = new Date().toISOString()
        unreadCount.value = Math.max(0, unreadCount.value - 1)
      } else if (!item) {
        await fetchUnreadCount()
      }
    } catch {
      // ignore
    }
  }

  function connectSocket() {
    disconnect()
    const token = authStore.accessToken
    if (!token) return
    notificationConnectionAdapter.connect(
      token,
      pushFromSocket,
      (disconnect) => {
        disconnectSocket = disconnect
      },
      ({ resource }) => {
        refreshAccess ||= ['users', 'roles', 'applications', '*'].includes(resource)
        refreshNotifications ||= ['notifications', '*'].includes(resource)
        if (syncTimer) clearTimeout(syncTimer)
        syncTimer = setTimeout(() => {
          syncTimer = null
          if (authStore.accessToken !== token) return
          void queryClient.invalidateQueries({ refetchType: 'active' })
          if (refreshAccess) void authStore.fetchProfile()
          if (refreshNotifications) {
            void fetchList()
            void fetchUnreadCount()
          }
          refreshAccess = false
          refreshNotifications = false
        }, 250)
      },
    )
  }

  function disconnect() {
    if (syncTimer) {
      clearTimeout(syncTimer)
      syncTimer = null
    }
    refreshAccess = false
    refreshNotifications = false
    if (disconnectSocket) {
      disconnectSocket()
      disconnectSocket = null
    }
    notificationConnectionAdapter.disconnect()
    list.value = []
    total.value = 0
    unreadCount.value = 0
  }

  watch(
    () => authStore.accessToken,
    (token) => {
      if (token) {
        connectSocket()
        void fetchList()
        void fetchUnreadCount()
      } else {
        disconnect()
      }
    },
    { immediate: true },
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
