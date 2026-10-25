import { applicationsRepositoryKey } from '../../application/ports/applications.port'
import { useService } from '@shared/presentation/di/services'
import { useQuery } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { applicationsQueryKeys } from '../../application/applicationsQueryKeys'
import { sk } from '@shared/domain/stable-query-key'
export const applicationKeys = {
  all: applicationsQueryKeys.module,
  myApps: () => applicationsQueryKeys.myApps,
  menus: (slug: string) => [...applicationsQueryKeys.menus, sk(slug)] as const,
}

export function useMyApplications() {
  const applicationsApiRepository = useService(applicationsRepositoryKey)
  return useQuery({
    queryKey: applicationKeys.myApps(),
    queryFn: () => applicationsApiRepository.getMyApplications(),
  })
}

export function useApplicationMenus(slug: MaybeRefOrGetter<string>) {
  const applicationsApiRepository = useService(applicationsRepositoryKey)
  const slugValue = computed(() => toValue(slug))
  return useQuery({
    queryKey: computed(() => applicationKeys.menus(slugValue.value)),
    queryFn: () => applicationsApiRepository.getMenus(slugValue.value),
    enabled: computed(() => !!slugValue.value),
  })
}
