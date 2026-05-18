import { useQuery } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { applicationsQueryKeys } from './applicationsQueryKeys'
import { sk } from './stableQueryKey'
import { applicationsApiRepository } from '../infrastructure/repositories/applications.api.repository'

export const applicationKeys = {
  all: applicationsQueryKeys.module,
  myApps: () => applicationsQueryKeys.myApps,
  menus: (slug: string) => [...applicationsQueryKeys.menus, sk(slug)] as const,
}

export function useMyApplications() {
  return useQuery({
    queryKey: applicationKeys.myApps(),
    queryFn: () => applicationsApiRepository.getMyApplications(),
  })
}

export function useApplicationMenus(slug: MaybeRefOrGetter<string>) {
  const slugValue = computed(() => toValue(slug))
  return useQuery({
    queryKey: computed(() => applicationKeys.menus(slugValue.value)),
    queryFn: () => applicationsApiRepository.getMenus(slugValue.value),
    enabled: computed(() => !!slugValue.value),
  })
}
