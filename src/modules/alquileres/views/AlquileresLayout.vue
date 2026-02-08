<script setup lang="ts">
import { ref, computed } from 'vue'
import { AppLayoutSidebar, AppHeader } from '@layouts/components'
import { useAppLayout } from '../composables'

/**
 * AlquileresLayout
 * Layout para la aplicación Alquileres con sidebar dinámico
 */

const { application, menus, menusLoading } = useAppLayout()

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
    : { name: 'Alquileres', slug: 'alquileres', icon: 'key', color: '#0BB0BE' }
)
</script>

<template>
  <div class="min-h-screen" style="background-color: var(--color-background);">
    <!-- Sidebar -->
    <AppLayoutSidebar
      :menus="menus"
      :application="applicationInfo"
      back-url="/applications"
      :is-collapsed="isSidebarCollapsed"
      :is-mobile-open="isMobileSidebarOpen"
      @close-mobile="closeMobileSidebar"
    />

    <!-- Main content -->
    <div
      :class="[
        'transition-all duration-300 ease-in-out',
        isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64',
      ]"
    >
      <AppHeader
        :is-sidebar-collapsed="isSidebarCollapsed"
        @toggle-sidebar="toggleSidebar"
        @toggle-mobile-sidebar="toggleMobileSidebar"
      />

      <main class="p-4 lg:p-6 mt-16">
        <div v-if="menusLoading" class="flex justify-center py-12">
          <svg
            class="animate-spin h-8 w-8"
            style="color: var(--color-primary);"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            />
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        </div>
        <router-view v-else />
      </main>
    </div>

    <!-- Mobile backdrop -->
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
