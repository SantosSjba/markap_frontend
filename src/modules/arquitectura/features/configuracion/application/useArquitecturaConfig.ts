import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/vue-query'
import { markapAlert } from '@/shared/composables'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import { invalidateQuerySubtree } from '@/shared/utils/invalidateQuerySubtree'
import type { ArquitecturaProjectStageDTO } from '../domain/config.types'
import { arquitecturaConfigApiRepository as arquitecturaConfigRepository } from '../infrastructure/repositories/arquitectura-config.api.repository'

export const arquitecturaConfigKeys = {
  root: ['arquitectura-config'] as const,
  bootstrap: () => [...arquitecturaConfigKeys.root, 'bootstrap'] as const,
}

export function invalidateArquitecturaConfigCache(qc: QueryClient) {
  return invalidateQuerySubtree(qc, arquitecturaConfigKeys.root)
}

export function useArquitecturaConfigBootstrap() {
  return useQuery({
    queryKey: arquitecturaConfigKeys.bootstrap(),
    queryFn: () => arquitecturaConfigRepository.bootstrap(),
    staleTime: 30_000,
  })
}

export function useArquitecturaSaveProjectStages() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (stages: ArquitecturaProjectStageDTO[]) =>
      arquitecturaConfigRepository.replaceProjectStages(stages),
    onSuccess: () => {
      void invalidateArquitecturaConfigCache(qc)
      void markapAlert.toast.success('Etapas actualizadas')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo guardar', getApiErrorMessage(e)),
  })
}

export function useArquitecturaSaveArquitecturaProjectNumbering() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { prefix?: string; lastNumber?: number }) =>
      arquitecturaConfigRepository.patchArquitecturaProjectNumbering(body),
    onSuccess: () => {
      void invalidateArquitecturaConfigCache(qc)
      void markapAlert.toast.success('Numeración actualizada')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo guardar', getApiErrorMessage(e)),
  })
}
