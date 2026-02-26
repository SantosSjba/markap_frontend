import { VueQueryPlugin, QueryClient, type VueQueryPluginOptions } from '@tanstack/vue-query'
import type { App } from 'vue'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      retry: 1,
      refetchOnWindowFocus: true,
      refetchOnMount: false,
    },
    mutations: {
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
