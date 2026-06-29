<script setup lang="ts">
import { ref, computed } from 'vue'
import { AppLayoutSidebar, AppHeader } from '@layouts/components'
import AppIcon from '@shared/components/ui/AppIcon.vue'
import { useContabilidadAppLayout } from '../composables'
import ContabilidadPeriodBar from '../components/ContabilidadPeriodBar.vue'
import ContabilidadLegalEntityBar from '../components/ContabilidadLegalEntityBar.vue'

const { application, menus, menusLoading } = useContabilidadAppLayout()

const isSidebarCollapsed = ref(false)
const isMobileSidebarOpen = ref(false)

const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}

const toggleMobileSidebar = () => {
  isMobileSidebarOpen.value = !isMobileSidebarOpen.value
}

const closeMobileSidebar = () => {
  isMobileSidebarOpen.value = false
}

const applicationInfo = computed(() =>
  application.value
    ? {
        name: application.value.name,
        slug: application.value.slug,
        icon: application.value.icon,
        color: application.value.color,
      }
    : {
        name: 'Sistema Contable',
        slug: 'contabilidad',
        icon: 'calculator',
        color: '#8B5CF6',
      },
)
</script>

<template>
  <div class="min-h-screen" style="background-color: var(--color-background);">
    <AppLayoutSidebar
      :menus="menus"
      :application="applicationInfo"
      back-url="/applications"
      :is-collapsed="isSidebarCollapsed"
      :is-mobile-open="isMobileSidebarOpen"
      @close-mobile="closeMobileSidebar"
    />

    <div
      :class="[
        'transition-all duration-300 ease-in-out',
        isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64',
      ]"
    >
      <AppHeader
        :is-sidebar-collapsed="isSidebarCollapsed"
        minimal-user-menu
        profile-to="/contabilidad/perfil"
        notifications-application-slug="contabilidad"
        @toggle-sidebar="toggleSidebar"
        @toggle-mobile-sidebar="toggleMobileSidebar"
      />

      <main class="p-4 lg:p-6 mt-16">
        <div v-if="menusLoading" class="flex justify-center py-12">
          <AppIcon icon="line-md:loading-loop" :size="32" color="var(--color-primary)" />
        </div>
        <template v-else>
          <ContabilidadLegalEntityBar />
          <ContabilidadPeriodBar />
          <router-view />
        </template>
      </main>
    </div>

    <Transition
      enter-active-class="transition-opacity duration-300"
      leave-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isMobileSidebarOpen"
        class="fixed inset-0 bg-black/50 z-30 lg:hidden"
        @click="closeMobileSidebar"
      />
    </Transition>
  </div>
</template>
