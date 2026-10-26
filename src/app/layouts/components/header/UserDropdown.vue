<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@modules/auth/presentation/stores/auth.store'
import { useNotificationsStore } from '@modules/notifications/presentation/stores/notifications.store'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@shared/presentation/ui/dropdown-menu'
import {
  ChevronDownIcon,
  GearIcon,
  LayoutGridIcon,
  LogOutIcon,
  UserCircleIcon,
} from '@shared/presentation/icons/layout'
import { cn } from '@shared/presentation/utils/cn'

interface UserDropdownProps {
  profileTo: string
  /** Oculta el acceso a Configuración (apps de negocio). */
  minimal?: boolean
}

withDefaults(defineProps<UserDropdownProps>(), { minimal: false })

const router = useRouter()
const authStore = useAuthStore()
const notificationsStore = useNotificationsStore()
const isOpen = ref(false)

const handleLogout = () => {
  notificationsStore.isDropdownOpen = false
  notificationsStore.disconnect()
  authStore.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <DropdownMenu :open="isOpen" @update:open="isOpen = $event">
    <DropdownMenuTrigger class="dropdown-toggle flex items-center text-gray-700 dark:text-gray-400">
      <span
        class="me-3 flex h-11 w-11 items-center justify-center overflow-hidden rounded-lg bg-brand-500 text-sm font-semibold text-white"
      >
        {{ authStore.userInitials || 'U' }}
      </span>

      <span class="me-1 block text-sm font-medium">
        {{ authStore.user?.firstName || 'Usuario' }}
      </span>

      <ChevronDownIcon
        :class="
          cn(
            'size-5 text-gray-500 duration-200 dark:text-gray-400',
            isOpen ? 'rotate-180' : 'rotate-0',
          )
        "
      />
    </DropdownMenuTrigger>

    <DropdownMenuContent align="end" :side-offset="12" class="w-65 p-3">
      <div class="px-3 py-2">
        <span class="block text-sm font-medium text-gray-700 dark:text-gray-400">
          {{ authStore.userFullName }}
        </span>
        <span class="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
          {{ authStore.user?.email }}
        </span>
      </div>

      <DropdownMenuSeparator />

      <DropdownMenuItem :to="profileTo">
        <UserCircleIcon class="size-6" />
        Mi perfil
      </DropdownMenuItem>

      <DropdownMenuItem v-if="!minimal" to="/settings">
        <GearIcon class="size-6" />
        Configuración
      </DropdownMenuItem>

      <DropdownMenuItem to="/applications">
        <LayoutGridIcon class="size-6" />
        Aplicaciones
      </DropdownMenuItem>

      <DropdownMenuSeparator />

      <DropdownMenuItem variant="destructive" @select="handleLogout">
        <LogOutIcon />
        Cerrar sesión
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
