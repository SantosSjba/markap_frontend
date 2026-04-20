import { useQuery } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { applicationsService } from '../infrastructure/applications.service'

export const applicationKeys = {
  all: ['applications'] as const,
  myApps: () => [...applicationKeys.all, 'me'] as const,
  menus: (slug: string) => [...applicationKeys.all, slug, 'menus'] as const,
}

export function useMyApplications() {
  return useQuery({
    queryKey: applicationKeys.myApps(),
    queryFn: () => applicationsService.getMyApplications(),
  })
}

export function useApplicationMenus(slug: MaybeRefOrGetter<string>) {
  const slugValue = computed(() => toValue(slug))
  return useQuery({
    queryKey: computed(() => applicationKeys.menus(slugValue.value)),
    queryFn: () => applicationsService.getMenus(slugValue.value),
    enabled: computed(() => !!slugValue.value),
  })
}
