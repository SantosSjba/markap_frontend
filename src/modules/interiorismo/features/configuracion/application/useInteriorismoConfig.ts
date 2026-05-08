import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/vue-query'
import { markapAlert } from '@/shared/composables'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import { invalidateQuerySubtree } from '@/shared/utils/invalidateQuerySubtree'
import type { InteriorismoProjectStageDTO } from '../domain/config.types'
import { interiorismoConfigApiRepository as interiorismoConfigRepository } from '../infrastructure/repositories/interiorismo-config.api.repository'

export const interiorismoConfigKeys = {
  root: ['interiorismo-config'] as const,
  bootstrap: () => [...interiorismoConfigKeys.root, 'bootstrap'] as const,
}

export function invalidateInteriorismoConfigCache(qc: QueryClient) {
  return invalidateQuerySubtree(qc, interiorismoConfigKeys.root)
}

export function useInteriorismoConfigBootstrap() {
  return useQuery({
    queryKey: interiorismoConfigKeys.bootstrap(),
    queryFn: () => interiorismoConfigRepository.bootstrap(),
    staleTime: 30_000,
  })
}

export function useInteriorismoSaveProjectStages() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (stages: InteriorismoProjectStageDTO[]) =>
      interiorismoConfigRepository.replaceProjectStages(stages),
    onSuccess: () => {
      void invalidateInteriorismoConfigCache(qc)
      void markapAlert.toast.success('Etapas actualizadas')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo guardar', getApiErrorMessage(e)),
  })
}

export function useInteriorismoSaveInteriorProjectNumbering() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { prefix?: string; lastNumber?: number }) =>
      interiorismoConfigRepository.patchInteriorProjectNumbering(body),
    onSuccess: () => {
      void invalidateInteriorismoConfigCache(qc)
      void markapAlert.toast.success('Numeración actualizada')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo guardar', getApiErrorMessage(e)),
  })
}
