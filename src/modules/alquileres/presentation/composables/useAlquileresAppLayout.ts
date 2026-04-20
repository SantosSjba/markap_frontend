import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useMyApplications, useApplicationMenus } from '@modules/applications'

/**
 * Composable de presentación: depende de Vue Router + menús por slug (Alquileres).
 */
export function useAlquileresAppLayout() {
  const route = useRoute()
  const slug = computed(() => {
    const seg = route.path.split('/').filter(Boolean)[0]
    return seg || 'alquileres'
  })

  const { data: applications } = useMyApplications()
  const application = computed(
    () => applications.value?.find((a) => a.slug === slug.value) ?? null,
  )

  const { data: menus, isLoading: menusLoading } = useApplicationMenus(slug)

  return {
    slug,
    application,
    menus: computed(() => menus.value ?? []),
    menusLoading,
  }
}
