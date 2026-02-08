import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { applicationsService } from '@modules/applications/services'
import { useMyApplications } from '@modules/applications/composables'

/**
 * Hook para layout de aplicación (menús + info de app)
 */
export function useAppLayout() {
  const route = useRoute()
  const slug = computed(() => {
    const seg = route.path.split('/').filter(Boolean)[0]
    return seg || 'alquileres'
  })

  const { data: applications } = useMyApplications()
  const application = computed(
    () => applications.value?.find((a) => a.slug === slug.value) ?? null
  )

  const { data: menus, isLoading: menusLoading } = useQuery({
    queryKey: ['applications', slug.value, 'menus'],
    queryFn: () => applicationsService.getMenus(slug.value),
    enabled: computed(() => !!slug.value),
  })

  return {
    slug,
    application,
    menus: computed(() => menus.value ?? []),
    menusLoading,
  }
}
