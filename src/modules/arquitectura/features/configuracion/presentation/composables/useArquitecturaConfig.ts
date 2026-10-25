import { arquitecturaConfigRepositoryKey } from '../../application/ports/arquitectura-config.port'
import { useService } from '@shared/presentation/di/services'
import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/vue-query'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { invalidateModuleQueries } from '@shared/utils/invalidateModuleQueries'
import type { ArquitecturaProjectStageDTO } from '../../domain/config.types'
export const arquitecturaConfigKeys = {
  root: ['arquitectura-config'] as const,
  bootstrap: () => [...arquitecturaConfigKeys.root, 'bootstrap'] as const,
}

export function invalidateArquitecturaConfigCache(qc: QueryClient) {
  return invalidateModuleQueries(qc, 'arquitectura')
}

export function useArquitecturaConfigBootstrap() {
  const arquitecturaConfigRepository = useService(arquitecturaConfigRepositoryKey)
  return useQuery({
    queryKey: arquitecturaConfigKeys.bootstrap(),
    queryFn: () => arquitecturaConfigRepository.bootstrap(),
    staleTime: 30_000,
  })
}

export function useArquitecturaSaveProjectStages() {
  const arquitecturaConfigRepository = useService(arquitecturaConfigRepositoryKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (stages: ArquitecturaProjectStageDTO[]) =>
      arquitecturaConfigRepository.replaceProjectStages(stages),
    onSuccess: async () => {
      await invalidateArquitecturaConfigCache(qc)
      void markapAlert.toast.success('Etapas actualizadas')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo guardar', getApiErrorMessage(e)),
  })
}

export function useArquitecturaSaveArquitecturaProjectNumbering() {
  const arquitecturaConfigRepository = useService(arquitecturaConfigRepositoryKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { prefix?: string; lastNumber?: number }) =>
      arquitecturaConfigRepository.patchArquitecturaProjectNumbering(body),
    onSuccess: async () => {
      await invalidateArquitecturaConfigCache(qc)
      void markapAlert.toast.success('Numeración actualizada')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo guardar', getApiErrorMessage(e)),
  })
}
