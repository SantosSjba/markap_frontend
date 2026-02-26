<script setup lang="ts">
import { ref } from 'vue'
import AppSidebar from './components/AppSidebar.vue'
import AppHeader from './components/AppHeader.vue'

/**
 * MainLayout Component
 * Main application layout with sidebar and header
 */

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
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Sidebar -->
    <AppSidebar
      :is-collapsed="isSidebarCollapsed"
      :is-mobile-open="isMobileSidebarOpen"
      @close-mobile="closeMobileSidebar"
    />

    <!-- Main content area -->
    <div
      :class="[
        'transition-all duration-300 ease-in-out',
        isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64',
      ]"
    >
      <!-- Header -->
      <AppHeader
        :is-sidebar-collapsed="isSidebarCollapsed"
        @toggle-sidebar="toggleSidebar"
        @toggle-mobile-sidebar="toggleMobileSidebar"
      />

      <!-- Page content -->
      <main class="p-4 lg:p-6 mt-16">
        <router-view />
      </main>
    </div>

    <!-- Mobile sidebar backdrop -->
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
