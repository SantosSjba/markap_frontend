<script setup lang="ts">
import AppIcon from '@shared/components/ui/AppIcon.vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

/**
 * AppSidebar Component
 * Main application sidebar navigation
 */

interface Props {
  isCollapsed: boolean
  isMobileOpen: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  closeMobile: []
}>()

const route = useRoute()

// Menu items - These should come from an API or store in production
const menuItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'home',
    to: '/dashboard',
  },
  {
    id: 'users',
    label: 'Usuarios',
    icon: 'users',
    to: '/users',
  },
  {
    id: 'settings',
    label: 'Configuración',
    icon: 'settings',
    to: '/settings',
  },
]

const isActive = (path: string) => {
  return route.path.startsWith(path)
}

const sidebarClasses = computed(() => [
  'fixed top-0 left-0 h-full bg-primary-700 z-40',
  'transition-all duration-300 ease-in-out',
  props.isCollapsed ? 'w-20' : 'w-64',
  props.isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
])
</script>

<template>
  <aside :class="sidebarClasses">
    <!-- Logo -->
    <div class="h-16 flex items-center justify-center border-b border-white/10">
      <h1 v-if="!isCollapsed" class="text-xl font-bold text-white">Markap</h1>
      <span v-else class="text-xl font-bold text-white">M</span>
    </div>

    <!-- Navigation -->
    <nav class="p-4 space-y-2">
      <router-link
        v-for="item in menuItems"
        :key="item.id"
        :to="item.to"
        :class="[
          'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200',
          isActive(item.to)
            ? 'bg-primary-500 text-white'
            : 'text-primary-100 hover:bg-white/10',
          isCollapsed && 'justify-center',
        ]"
        @click="emit('closeMobile')"
      >
        <AppIcon :icon="`lucide:${item.icon}`" :size="20" color="currentColor" />
        <span v-if="!isCollapsed" class="font-medium">{{ item.label }}</span>
      </router-link>
    </nav>

    <!-- Footer -->
    <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
      <div v-if="!isCollapsed" class="text-xs text-primary-200 text-center">
        Markap v1.0
      </div>
    </div>
  </aside>
</template>
