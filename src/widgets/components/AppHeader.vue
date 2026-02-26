<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@features/auth/stores/auth.store'
import { useNotificationsStore } from '@features/notifications/notifications.store'
import { ThemeToggle } from '@shared/components'

/**
 * AppHeader Component
 * Main application header with user menu and notifications
 */

interface Props {
  isSidebarCollapsed: boolean
  minimalUserMenu?: boolean
  profileTo?: string
}

const props = withDefaults(defineProps<Props>(), {
  minimalUserMenu: false,
  profileTo: '/settings/profile',
})

const emit = defineEmits<{
  toggleSidebar: []
  toggleMobileSidebar: []
}>()

const authStore = useAuthStore()
const notificationsStore = useNotificationsStore()
const router = useRouter()
const isUserMenuOpen = ref(false)

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
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <!-- Desktop toggle button -->
      <button
        type="button"
        class="hidden lg:block p-2 rounded-lg hover-surface"
        @click="emit('toggleSidebar')"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
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
          <svg class="w-6 h-6 text-[var(--color-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span
            v-if="notificationsStore.hasUnread"
            class="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold bg-red-500 text-white rounded-full"
          >
            {{ notificationsStore.unreadCount > 99 ? '99+' : notificationsStore.unreadCount }}
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
              <template v-else-if="notificationsStore.list.length === 0">
                <p class="p-4 text-center text-sm text-[var(--color-text-muted)]">
                  No hay notificaciones
                </p>
              </template>
              <template v-else>
                <button
                  v-for="n in notificationsStore.list"
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
          <svg class="w-4 h-4 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
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
