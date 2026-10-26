<script setup lang="ts">
import type { MenuItem } from '@shared/domain/menu.types'
import { SidebarInset, SidebarProvider } from '@shared/presentation/ui/sidebar'
import { useSidebarProvider } from '@shared/presentation/composables/useSidebar'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import AppHeader from './components/header/AppHeader.vue'
import AppSidebar from './components/sidebar/AppSidebar.vue'
import type { ApplicationInfo } from './components/sidebar/types'
/**
 * AdminLayout — shell de TailAdmin (sidebar + header) para todas las aplicaciones.
 * Cada módulo aporta sus menús (desde la BD o estáticos) y su información de aplicación.
 */

interface AdminLayoutProps {
  menus: MenuItem[]
  application: ApplicationInfo
  loading?: boolean
  backUrl?: string
  backLabel?: string
  profileTo?: string
  minimalUserMenu?: boolean
  notificationsApplicationSlug?: string
}

withDefaults(defineProps<AdminLayoutProps>(), {
  loading: false,
  backUrl: '/applications',
  backLabel: 'Volver a Aplicaciones',
  profileTo: '/settings/profile',
  minimalUserMenu: false,
})

useSidebarProvider()
</script>

<template>
  <SidebarProvider>
    <AppSidebar
      :menus="menus"
      :application="application"
      :back-url="backUrl"
      :back-label="backLabel"
    />

    <SidebarInset>
      <AppHeader
        :home-url="`/${application.slug}`"
        :profile-to="profileTo"
        :minimal-user-menu="minimalUserMenu"
        :notifications-application-slug="notificationsApplicationSlug"
      />

      <div class="mx-auto w-full max-w-(--breakpoint-2xl) p-4 md:p-6">
        <div v-if="loading" class="flex justify-center py-12">
          <AppIcon icon="line-md:loading-loop" :size="32" color="var(--color-brand-500)" />
        </div>
        <slot v-else />
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>
