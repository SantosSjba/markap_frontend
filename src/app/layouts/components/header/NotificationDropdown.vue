<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationsStore } from '@modules/notifications/presentation/stores/notifications.store'
import { type NotificationItem } from '@modules/notifications/domain/notification.types'
import { Button } from '@shared/presentation/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@shared/presentation/ui/dropdown-menu'
import { ScrollArea } from '@shared/presentation/ui/scroll-area'
import { BellIcon, DotIcon, XIcon } from '@shared/presentation/icons/layout'
import { buttonVariants } from '@shared/presentation/ui/button'
import { cn } from '@shared/presentation/utils/cn'
import { formatShortDate, PERU_LOCALE, PERU_TIME_ZONE } from '@shared/utils/formatters'

interface NotificationDropdownProps {
  /**
   * Slug de aplicación actual (ej. alquileres, ventas). Si se define, el listado y el
   * contador solo incluyen notificaciones con data.applicationSlug igual
   * o sin applicationSlug (avisos globales / legado).
   */
  applicationSlug?: string
}

const props = defineProps<NotificationDropdownProps>()

const notificationsStore = useNotificationsStore()
const router = useRouter()

function notificationVisibleInApp(n: NotificationItem, appSlug: string | undefined) {
  if (!appSlug) return true
  const slug = n.data?.applicationSlug as string | undefined
  if (slug === undefined || slug === null) return true
  return slug === appSlug
}

const notifications = computed(() =>
  notificationsStore.list.filter((n: NotificationItem) =>
    notificationVisibleInApp(n, props.applicationSlug),
  ),
)

const unreadCount = computed(() => {
  if (!props.applicationSlug) return notificationsStore.unreadCount
  return notifications.value.filter((n: NotificationItem) => !n.readAt).length
})

const notifying = computed(() => unreadCount.value > 0)

onMounted(() => {
  notificationsStore.requestBrowserPermission()
})

const handleOpenChange = (open: boolean) => {
  notificationsStore.isDropdownOpen = open
  if (open) {
    notificationsStore.fetchList()
    notificationsStore.fetchUnreadCount()
  }
}

function formatNotificationDate(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60000) return 'Ahora'
  if (diff < 3600000) return `Hace ${Math.floor(diff / 60000)} min`
  if (diff < 86400000) {
    return d.toLocaleTimeString(PERU_LOCALE, {
      timeZone: PERU_TIME_ZONE,
      hour: '2-digit',
      minute: '2-digit',
    })
  }
  return formatShortDate(d)
}

function openNotification(n: NotificationItem) {
  notificationsStore.markAsRead(n.id)
  notificationsStore.isDropdownOpen = false
  const slug = n.data?.applicationSlug as string | undefined
  const rentalId = n.data?.rentalId as string | undefined
  if (slug && rentalId) router.push(`/${slug}/contratos/${rentalId}`)
}
</script>

<template>
  <DropdownMenu :open="notificationsStore.isDropdownOpen" @update:open="handleOpenChange">
    <DropdownMenuTrigger
      :class="buttonVariants({ variant: 'outline', size: 'icon-lg', class: 'relative' })"
      aria-label="Notificaciones"
    >
      <span
        :class="
          cn(
            'absolute end-0 -top-0.5 z-10 h-2 w-2 translate-x-1/2 rounded-full bg-orange-400',
            !notifying ? 'hidden' : 'flex',
          )
        "
      >
        <span
          class="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75"
        />
      </span>
      <BellIcon class="size-auto!" />
    </DropdownMenuTrigger>

    <DropdownMenuContent
      align="end"
      :side-offset="12"
      class="w-87.5 overflow-hidden p-3 sm:w-90.25 dark:bg-[#1E2635]"
    >
      <div class="flex items-center justify-between pb-3">
        <h5 class="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Notificaciones
          <span v-if="unreadCount" class="ms-1 text-sm font-medium text-gray-500 dark:text-gray-400">
            ({{ unreadCount > 99 ? '99+' : unreadCount }})
          </span>
        </h5>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="Cerrar notificaciones"
          @click="notificationsStore.isDropdownOpen = false"
        >
          <XIcon class="size-5" />
        </Button>
      </div>

      <DropdownMenuSeparator class="my-0" />

      <ScrollArea class="h-96">
        <div class="flex flex-col pe-2">
          <p
            v-if="notificationsStore.isLoading && notifications.length === 0"
            class="p-4 text-center text-sm text-gray-500 dark:text-gray-400"
          >
            Cargando...
          </p>
          <p
            v-else-if="notifications.length === 0"
            class="p-4 text-center text-sm text-gray-500 dark:text-gray-400"
          >
            No hay notificaciones
          </p>
          <template v-for="item in notifications" v-else :key="item.id">
            <DropdownMenuItem
              :class="
                cn(
                  'flex items-start gap-3 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-white/5',
                  !item.readAt && 'bg-brand-25 dark:bg-brand-500/5',
                )
              "
              @select="openNotification(item)"
            >
              <span
                class="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400"
              >
                <BellIcon class="size-5 text-current!" />
                <span
                  v-if="!item.readAt"
                  class="absolute end-0 bottom-0 size-2.5 rounded-full border-[1.5px] border-white bg-success-500 dark:border-gray-900"
                />
              </span>
              <span class="block flex-1 text-start">
                <span class="mb-1.5 block text-sm font-medium text-gray-800 dark:text-white/90">
                  {{ item.title }}
                </span>
                <span
                  v-if="item.body"
                  class="mb-1.5 line-clamp-2 block text-sm text-gray-500 dark:text-gray-400"
                >
                  {{ item.body }}
                </span>
                <span class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>{{ item.readAt ? 'Leída' : 'Nueva' }}</span>
                  <DotIcon class="size-2 text-gray-400 dark:text-gray-500" />
                  <span>{{ formatNotificationDate(item.createdAt) }}</span>
                </span>
              </span>
            </DropdownMenuItem>
            <DropdownMenuSeparator
              class="my-0.5 bg-gray-100 last-of-type:hidden dark:bg-gray-700"
            />
          </template>
        </div>
      </ScrollArea>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
