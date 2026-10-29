import { interiorismoConfigRepositoryKey } from '../../application/ports/interiorismo-config.port'
import { useService } from '@shared/presentation/di/services'
import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/vue-query'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { invalidateModuleQueries } from '@shared/utils/invalidateModuleQueries'
import type { InteriorismoProjectStageDTO } from '../../domain/config.types'
export const interiorismoConfigKeys = {
  root: ['interiorismo-config'] as const,
  bootstrap: () => [...interiorismoConfigKeys.root, 'bootstrap'] as const,
}

export function invalidateInteriorismoConfigCache(qc: QueryClient) {
  return invalidateModuleQueries(qc, 'interiorismo')
}

export function useInteriorismoConfigBootstrap() {
  const interiorismoConfigRepository = useService(interiorismoConfigRepositoryKey)
  return useQuery({
    queryKey: interiorismoConfigKeys.bootstrap(),
    queryFn: () => interiorismoConfigRepository.bootstrap(),
    staleTime: 30_000,
  })
}

export function useInteriorismoSaveProjectStages() {
  const interiorismoConfigRepository = useService(interiorismoConfigRepositoryKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (stages: InteriorismoProjectStageDTO[]) =>
      interiorismoConfigRepository.replaceProjectStages(stages),
    onSuccess: async () => {
      await invalidateInteriorismoConfigCache(qc)
      void markapAlert.toast.success('Etapas actualizadas')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo guardar', getApiErrorMessage(e)),
  })
}
