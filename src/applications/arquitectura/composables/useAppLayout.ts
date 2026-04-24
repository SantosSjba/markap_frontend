import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useMyApplications, useApplicationMenus } from '@features/applications/composables'
import {
  ARQUITECTURA_FALLBACK_MENUS,
  arquitecturaMenusLookComplete,
} from '../config/fallbackMenus'

/**
 * Menús por API; fallback si el árbol de Proyectos no está en BD (sin seed o datos viejos).
 */
export function useAppLayout() {
  const route = useRoute()
  const slug = computed(() => {
    const seg = route.path.split('/').filter(Boolean)[0]
    return seg || 'arquitectura'
  })

  const { data: menusFromApi, isLoading: menusLoading } = useApplicationMenus(slug)
  const { data: applications } = useMyApplications()
  const application = computed(
    () => applications.value?.find((a) => a.slug === slug.value) ?? null,
  )

  const menus = computed(() => {
    if (slug.value !== 'arquitectura') {
      return menusFromApi.value ?? []
    }
    const api = menusFromApi.value ?? []
    if (!menusLoading.value && arquitecturaMenusLookComplete(api)) {
      return api
    }
    return ARQUITECTURA_FALLBACK_MENUS
  })

  return {
    slug,
    application,
    menus,
    menusLoading,
  }
}
