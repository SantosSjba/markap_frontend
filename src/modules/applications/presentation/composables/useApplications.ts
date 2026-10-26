import { applicationsRepositoryKey } from '../../application/ports/applications.port'
import { useService } from '@shared/presentation/di/services'
import { useQuery } from '@tanstack/vue-query'
import { applicationsQueryKeys } from '../../application/applicationsQueryKeys'
export const applicationKeys = {
  all: applicationsQueryKeys.module,
  myApps: () => applicationsQueryKeys.myApps,
}

export function useMyApplications() {
  const applicationsApiRepository = useService(applicationsRepositoryKey)
  return useQuery({
    queryKey: applicationKeys.myApps(),
    queryFn: () => applicationsApiRepository.getMyApplications(),
  })
}
