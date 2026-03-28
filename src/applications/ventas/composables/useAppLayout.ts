import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useMyApplications, useApplicationMenus } from '@features/applications/composables'
import { VENTAS_FALLBACK_MENUS } from '../config/ventasFallbackMenus'

/**
 * Hook para layout de aplicación (menús + info de app)
 */
export function useAppLayout() {
  const route = useRoute()
  const slug = computed(() => {
    const seg = route.path.split('/').filter(Boolean)[0]
    return seg || 'ventas'
  })

  const { data: applications } = useMyApplications()
  const application = computed(
    () => applications.value?.find((a) => a.slug === slug.value) ?? null
  )

  const { data: menus } = useApplicationMenus(slug)

  const menusEffective = computed(() => {
    const fromApi = menus.value ?? []
    return fromApi.length > 0 ? fromApi : VENTAS_FALLBACK_MENUS
  })

  return {
    slug,
    application,
    menus: menusEffective,
    /** No bloquear la vista: si la API viene vacía usamos menú local (misma estructura que el seed). */
    menusLoading: false,
  }
}
