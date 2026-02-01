import { useQuery } from '@tanstack/vue-query'
import { applicationsService } from '../services'

/**
 * Query Keys for Applications
 */
export const applicationKeys = {
  all: ['applications'] as const,
  myApps: () => [...applicationKeys.all, 'me'] as const,
}

/**
 * Hook to fetch user's applications
 */
export function useMyApplications() {
  return useQuery({
    queryKey: applicationKeys.myApps(),
    queryFn: () => applicationsService.getMyApplications(),
  })
}
