import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useMyApplications, useApplicationMenus } from '@features/applications/composables'

/**
 * Hook para layout de aplicación (menús + info de app).
 * Menús solo desde API (mismo criterio que Alquileres); el seed del backend los define.
 */
export function useAppLayout() {
  const route = useRoute()
  const slug = computed(() => {
    const seg = route.path.split('/').filter(Boolean)[0]
    return seg || 'ventas'
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
