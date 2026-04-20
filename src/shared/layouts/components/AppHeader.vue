<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@modules/auth'
import { useNotificationsStore, type NotificationItem } from '@shared/notifications'
import { ThemeToggle } from '@shared/components'
import AppIcon from '@shared/components/ui/AppIcon.vue'

/**
 * AppHeader Component
 * Main application header with user menu and notifications
 */

interface Props {
  isSidebarCollapsed: boolean
  minimalUserMenu?: boolean
  profileTo?: string
  /**
   * Slug de aplicación actual (ej. alquileres, ventas). Si se define, el listado y el
   * contador del campanita solo incluyen notificaciones con data.applicationSlug igual
   * o sin applicationSlug (avisos globales / legado).
   */
  notificationsApplicationSlug?: string
}

const props = withDefaults(defineProps<Props>(), {
  minimalUserMenu: false,
  profileTo: '/settings/profile',
})

function notificationVisibleInApp(n: NotificationItem, appSlug: string | undefined) {
  if (!appSlug) return true
  const slug = n.data?.applicationSlug as string | undefined
  if (slug === undefined || slug === null) return true
  return slug === appSlug
}

const emit = defineEmits<{
  toggleSidebar: []
  toggleMobileSidebar: []
}>()

const authStore = useAuthStore()
const notificationsStore = useNotificationsStore()
const router = useRouter()
const isUserMenuOpen = ref(false)

const headerNotifications = computed(() =>
  notificationsStore.list.filter((n: NotificationItem) =>
    notificationVisibleInApp(n, props.notificationsApplicationSlug),
  ),
)

const headerUnreadCount = computed(() => {
  if (!props.notificationsApplicationSlug) return notificationsStore.unreadCount
  return headerNotifications.value.filter((n: NotificationItem) => !n.readAt).length
})

const hasUnreadInContext = computed(() => headerUnreadCount.value > 0)

onMounted(() => {
  notificationsStore.requestBrowserPermission()
})

const toggleUserMenu = () => {
  isUserMenuOpen.value = !isUserMenuOpen.value
}

const closeUserMenu = () => {
  isUserMenuOpen.value = false
}

const toggleNotificationsDropdown = () => {
  notificationsStore.isDropdownOpen = !notificationsStore.isDropdownOpen
  if (notificationsStore.isDropdownOpen) {
    notificationsStore.fetchList()
    notificationsStore.fetchUnreadCount()
  }
}

const closeNotificationsDropdown = () => {
  notificationsStore.isDropdownOpen = false
}

const handleLogout = () => {
  closeUserMenu()
  closeNotificationsDropdown()
  notificationsStore.disconnect()
  authStore.logout()
}

function formatNotificationDate(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60000) return 'Ahora'
  if (diff < 3600000) return `Hace ${Math.floor(diff / 60000)} min`
  if (diff < 86400000) return d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' })
}

function openNotification(n: { id: string; data?: Record<string, unknown> | null }) {
  notificationsStore.markAsRead(n.id)
  closeNotificationsDropdown()
  const slug = n.data?.applicationSlug as string | undefined
  const rentalId = n.data?.rentalId as string | undefined
  if (slug && rentalId) router.push(`/${slug}/contratos/${rentalId}`)
}
</script>

<template>
  <header
    class="fixed top-0 right-0 h-16 bg-[var(--color-surface)] border-b border-[var(--color-border)] z-30 flex items-center justify-between px-4 lg:px-6"
    :class="[
      'transition-all duration-300',
      isSidebarCollapsed ? 'lg:left-20' : 'lg:left-64',
      'left-0',
    ]"
  >
    <!-- Left side -->
    <div class="flex items-center gap-4">
      <!-- Mobile menu button -->
      <button
        type="button"
        class="lg:hidden p-2 rounded-lg hover-surface"
        @click="emit('toggleMobileSidebar')"
      >
        <AppIcon icon="lucide:menu" :size="24" color="var(--color-text-primary)" />
      </button>

      <!-- Desktop toggle button -->
      <button
        type="button"
        class="hidden lg:block p-2 rounded-lg hover-surface"
        @click="emit('toggleSidebar')"
      >
        <AppIcon icon="lucide:menu" :size="24" color="var(--color-text-primary)" />
      </button>
    </div>

    <!-- Right side -->
    <div class="flex items-center gap-4">
      <ThemeToggle />
      <!-- Notifications -->
      <div class="relative">
        <button
          type="button"
          class="p-2 rounded-lg hover-surface relative"
          @click="toggleNotificationsDropdown"
        >
          <AppIcon icon="lucide:bell" :size="24" color="var(--color-text-secondary)" />
          <span
            v-if="hasUnreadInContext"
            class="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold bg-red-500 text-white rounded-full"
          >
            {{ headerUnreadCount > 99 ? '99+' : headerUnreadCount }}
          </span>
        </button>

        <!-- Notifications dropdown -->
        <Transition
          enter-active-class="transition-all duration-200"
          leave-active-class="transition-all duration-150"
          enter-from-class="opacity-0 scale-95"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="notificationsStore.isDropdownOpen"
            class="absolute right-0 mt-2 w-80 max-h-[400px] overflow-hidden bg-[var(--color-surface)] rounded-lg shadow-lg border border-[var(--color-border)] z-50 flex flex-col"
          >
            <div class="px-4 py-3 border-b border-[var(--color-border)]">
              <h3 class="text-sm font-semibold text-[var(--color-text-primary)]">Notificaciones</h3>
            </div>
            <div class="overflow-y-auto flex-1">
              <div v-if="notificationsStore.isLoading" class="p-4 text-center text-sm text-[var(--color-text-muted)]">
                Cargando...
              </div>
              <template v-else-if="headerNotifications.length === 0">
                <p class="p-4 text-center text-sm text-[var(--color-text-muted)]">
                  No hay notificaciones
                </p>
              </template>
              <template v-else>
                <button
                  v-for="n in headerNotifications"
                  :key="n.id"
                  type="button"
                  class="w-full text-left px-4 py-3 border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-surface-elevated)] transition-colors"
                  :class="{ 'bg-[var(--color-surface-elevated)]/50': !n.readAt }"
                  @click="openNotification(n)"
                >
                  <p class="text-sm font-medium text-[var(--color-text-primary)]">{{ n.title }}</p>
                  <p v-if="n.body" class="text-xs text-[var(--color-text-secondary)] mt-0.5 line-clamp-2">{{ n.body }}</p>
                  <p class="text-xs text-[var(--color-text-muted)] mt-1">{{ formatNotificationDate(n.createdAt) }}</p>
                </button>
              </template>
            </div>
          </div>
        </Transition>
        <div
          v-if="notificationsStore.isDropdownOpen"
          class="fixed inset-0 z-40"
          @click="closeNotificationsDropdown"
        />
      </div>

      <!-- User menu -->
      <div class="relative">
        <button
          type="button"
          class="flex items-center gap-2 p-2 rounded-lg hover-surface"
          @click="toggleUserMenu"
        >
          <div class="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-medium">
            {{ authStore.user?.firstName?.charAt(0) || 'U' }}
          </div>
          <span class="hidden md:block text-sm font-medium text-[var(--color-text-primary)]">
            {{ authStore.user?.firstName || 'Usuario' }}
          </span>
          <AppIcon icon="lucide:chevron-down" :size="16" color="var(--color-text-muted)" />
        </button>

        <!-- Dropdown menu -->
        <Transition
          enter-active-class="transition-all duration-200"
          leave-active-class="transition-all duration-150"
          enter-from-class="opacity-0 scale-95"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="isUserMenuOpen"
            class="absolute right-0 mt-2 w-48 bg-[var(--color-surface)] rounded-lg shadow-lg border border-[var(--color-border)] py-1 z-50"
          >
            <router-link
              :to="profileTo"
              class="block px-4 py-2 text-sm text-[var(--color-text-primary)] hover-surface rounded mx-1"
              @click="closeUserMenu"
            >
              Mi Perfil
            </router-link>
            <router-link
              v-if="!minimalUserMenu"
              to="/settings"
              class="block px-4 py-2 text-sm text-[var(--color-text-primary)] hover-surface rounded mx-1"
              @click="closeUserMenu"
            >
              Configuración
            </router-link>
            <hr class="my-1 border-[var(--color-border)]" />
            <button
              type="button"
              class="w-full text-left px-4 py-2 text-sm text-red-600 hover-surface rounded mx-1"
              @click="handleLogout"
            >
              Cerrar Sesión
            </button>
          </div>
        </Transition>
      </div>
    </div>
  </header>
</template>
