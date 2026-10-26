<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { SidebarHeader } from '@shared/presentation/ui/sidebar'
import type { ApplicationInfo } from './types'

interface AppSidebarHeaderProps {
  showContent: boolean
  application: ApplicationInfo
  homeUrl: string
}

defineProps<AppSidebarHeaderProps>()
</script>

<template>
  <SidebarHeader class="px-5 py-8">
    <RouterLink :to="homeUrl" class="flex items-center gap-3">
      <img
        src="/images/logo_bg_removed.png"
        alt="MARKAP Homes"
        width="40"
        height="40"
        class="size-10 shrink-0 object-contain"
      />
      <span v-if="showContent" class="min-w-0">
        <span class="block truncate text-lg font-semibold text-gray-800 dark:text-white/90">
          {{ application.name }}
        </span>
        <span class="block text-theme-xs text-gray-500 dark:text-gray-400">MARKAP Homes</span>
      </span>
    </RouterLink>
  </SidebarHeader>
</template>
