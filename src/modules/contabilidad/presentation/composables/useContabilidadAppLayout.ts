import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useMyApplications, useApplicationMenus } from '@modules/applications'
import {
  CONTABILIDAD_FALLBACK_MENUS,
  contabilidadMenusLookComplete,
} from '../../config/fallbackMenus'

export function useContabilidadAppLayout() {
  const route = useRoute()
  const slug = computed(() => {
    const seg = route.path.split('/').filter(Boolean)[0]
    return seg || 'contabilidad'
  })

  const { data: menusFromApi, isLoading: menusLoading } = useApplicationMenus(slug)
  const { data: applications } = useMyApplications()
  const application = computed(
    () => applications.value?.find((a) => a.slug === slug.value) ?? null,
  )

  const menus = computed(() => {
    if (slug.value !== 'contabilidad') {
      return menusFromApi.value ?? []
    }
    const api = menusFromApi.value ?? []
    if (!menusLoading.value && contabilidadMenusLookComplete(api)) {
      return api
    }
    return CONTABILIDAD_FALLBACK_MENUS
  })

  return {
    slug,
    application,
    menus,
    menusLoading,
  }
}
