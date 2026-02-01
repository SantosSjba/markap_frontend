import { VueQueryPlugin, QueryClient, type VueQueryPluginOptions } from '@tanstack/vue-query'
import type { App } from 'vue'

/**
 * Vue Query Configuration
 * 
 * Centralized configuration for TanStack Query
 * - Automatic caching
 * - Smart refetching
 * - Error handling
 */

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes
      staleTime: 1000 * 60 * 5,
      // Keep unused data in cache for 30 minutes
      gcTime: 1000 * 60 * 30,
      // Retry failed requests 1 time
      retry: 1,
      // Refetch on window focus
      refetchOnWindowFocus: true,
      // Don't refetch on mount if data exists
      refetchOnMount: false,
    },
    mutations: {
      // Retry mutations 0 times (fail immediately)
      retry: 0,
    },
  },
})

const vueQueryPluginOptions: VueQueryPluginOptions = {
  queryClient,
}

export function setupVueQuery(app: App) {
  app.use(VueQueryPlugin, vueQueryPluginOptions)
}

export { queryClient }
