import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useMyApplications, useApplicationMenus } from '@modules/applications'
import {
  PRODUCCION_FALLBACK_MENUS,
  produccionMenusLookComplete,
} from '../../config/fallbackMenus'

export function useProduccionAppLayout() {
  const route = useRoute()
  const slug = computed(() => {
    const seg = route.path.split('/').filter(Boolean)[0]
    return seg || 'produccion'
  })

  const { data: menusFromApi, isLoading: menusLoading } = useApplicationMenus(slug)
  const { data: applications } = useMyApplications()
  const application = computed(
    () => applications.value?.find((a) => a.slug === slug.value) ?? null,
  )

  const menus = computed(() => {
    if (slug.value !== 'produccion') {
      return menusFromApi.value ?? []
    }
    const api = menusFromApi.value ?? []
    if (!menusLoading.value && produccionMenusLookComplete(api)) {
      return api
    }
    return PRODUCCION_FALLBACK_MENUS
  })

  return {
    slug,
    application,
    menus,
    menusLoading,
  }
}
