import { VueQueryPlugin, QueryClient, type VueQueryPluginOptions } from '@tanstack/vue-query'
import type { App } from 'vue'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      retry: 1,
      refetchOnWindowFocus: true,
      /** Tras invalidar mutaciones, al volver a una vista los datos obsoletos se refrescan. */
      refetchOnMount: true,
    },
    mutations: {
      retry: 0,
    },
  },
})

const vueQueryPluginOptions: VueQueryPluginOptions = {
  queryClient,
}

/** Registra Vue Query; el panel de depuración está en `App.vue` (`VueQueryDevtools`). */
export function setupVueQuery(app: App) {
  app.use(VueQueryPlugin, vueQueryPluginOptions)
}

export { queryClient }
