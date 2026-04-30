import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useMyApplications, useApplicationMenus } from '@modules/applications'
import {
  INTERIORISMO_FALLBACK_MENUS,
  interiorismoMenusLookComplete,
} from '../../config/fallbackMenus'

/**
 * Layout de Interiorismo: menús por API; si el seed no creó el árbol (solo ítems planos o vacío),
 * se usa un menú estático equivalente al seed para que el sidebar siempre sea usable.
 */
export function useInteriorismoAppLayout() {
  const route = useRoute()
  const slug = computed(() => {
    const seg = route.path.split('/').filter(Boolean)[0]
    return seg || 'interiorismo'
  })

  const { data: menusFromApi, isLoading: menusLoading } = useApplicationMenus(slug)
  const { data: applications } = useMyApplications()
  const application = computed(
    () => applications.value?.find((a) => a.slug === slug.value) ?? null,
  )

  const menus = computed(() => {
    if (slug.value !== 'interiorismo') {
      return menusFromApi.value ?? []
    }
    const api = menusFromApi.value ?? []
    if (!menusLoading.value && interiorismoMenusLookComplete(api)) {
      return api
    }
    return INTERIORISMO_FALLBACK_MENUS
  })

  return {
    slug,
    application,
    menus,
    menusLoading,
  }
}
