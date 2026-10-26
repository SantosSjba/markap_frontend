<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Button } from '@shared/presentation/ui/button'
import { useSidebar } from '@shared/presentation/composables/useSidebar'
import { HorizontalDotsIcon, MenuTwoIcon, XIcon } from '@shared/presentation/icons/layout'
import { cn } from '@shared/presentation/utils/cn'
import NotificationDropdown from './NotificationDropdown.vue'
import ThemeToggleButton from '@shared/presentation/components/ui/ThemeToggle.vue'
import UserDropdown from './UserDropdown.vue'

interface AppHeaderProps {
  homeUrl: string
  profileTo: string
  minimalUserMenu?: boolean
  notificationsApplicationSlug?: string
}

withDefaults(defineProps<AppHeaderProps>(), { minimalUserMenu: false })

const isApplicationMenuOpen = ref(false)
const { openMobile, toggleSidebar } = useSidebar()

const toggleApplicationMenu = () => {
  isApplicationMenuOpen.value = !isApplicationMenuOpen.value
}
</script>

<template>
  <header
    class="sticky top-0 z-50 flex w-full shrink-0 border-gray-200 bg-white xl:border-b dark:border-gray-800 dark:bg-gray-900"
  >
    <div class="flex grow flex-col items-center justify-between xl:flex-row xl:px-6">
      <!-- Left side content -->
      <div
        class="flex w-full items-center justify-between gap-2 border-b border-gray-200 px-3 py-3 sm:gap-4 xl:justify-normal xl:border-b-0 xl:px-0 xl:py-4 dark:border-gray-800"
      >
        <Button
          variant="outline"
          size="icon"
          class="text-gray-500 lg:size-11 dark:text-gray-400"
          aria-label="Mostrar u ocultar menú lateral"
          @click="toggleSidebar"
        >
          <XIcon v-if="openMobile" class="size-6" />
          <MenuTwoIcon v-else class="size-auto! rtl:-scale-x-100" />
        </Button>

        <RouterLink :to="homeUrl" class="flex items-center gap-2 xl:hidden">
          <img
            width="32"
            height="32"
            class="size-8 object-contain"
            src="/images/logo_bg_removed.png"
            alt="MARKAP Homes"
          />
          <span class="text-base font-semibold text-gray-800 dark:text-white/90">MARKAP</span>
        </RouterLink>

        <Button
          variant="ghost"
          size="icon"
          aria-label="Mostrar opciones de usuario"
          class="text-gray-700 xl:hidden dark:text-gray-400"
          @click="toggleApplicationMenu"
        >
          <HorizontalDotsIcon />
        </Button>
      </div>

      <!-- Right side content -->
      <div
        :class="
          cn(
            'flex w-full items-center justify-between gap-4 px-5 py-4 shadow-theme-md xl:flex xl:justify-end xl:px-0 xl:shadow-none',
            isApplicationMenuOpen ? 'flex' : 'hidden',
          )
        "
      >
        <div class="2xsm:gap-3 flex items-center gap-2">
          <ThemeToggleButton />

          <NotificationDropdown :application-slug="notificationsApplicationSlug" />
        </div>
        <UserDropdown :profile-to="profileTo" :minimal="minimalUserMenu" />
      </div>
    </div>
  </header>
</template>
