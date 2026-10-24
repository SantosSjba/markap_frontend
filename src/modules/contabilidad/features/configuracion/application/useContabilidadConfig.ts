import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/vue-query'
import { markapAlert } from '@/shared/composables'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import { invalidateModuleQueries } from '@/shared/utils/invalidateModuleQueries'
import type {
  ContabilidadAppSettingsDTO,
  ContabilidadCompanyProfileDTO,
} from '../domain/config.types'
import { contabilidadConfigApiRepository as contabilidadConfigRepository } from '../infrastructure/repositories/contabilidad-config.api.repository'

export const contabilidadConfigKeys = {
  root: ['contabilidad-config'] as const,
  bootstrap: () => [...contabilidadConfigKeys.root, 'bootstrap'] as const,
}

export function invalidateContabilidadConfigCache(qc: QueryClient) {
  return invalidateModuleQueries(qc, 'contabilidad')
}

export function useContabilidadConfigBootstrap() {
  return useQuery({
    queryKey: contabilidadConfigKeys.bootstrap(),
    queryFn: () => contabilidadConfigRepository.bootstrap(),
    staleTime: 30_000,
  })
}

export function useContabilidadSaveCompany() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Partial<ContabilidadCompanyProfileDTO>) =>
      contabilidadConfigRepository.updateCompany(body),
    onSuccess: async () => {
      await invalidateContabilidadConfigCache(qc)
      void markapAlert.toast.success('Datos de empresa actualizados')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo guardar', getApiErrorMessage(e)),
  })
}

export function useContabilidadSaveSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Partial<ContabilidadAppSettingsDTO>) =>
      contabilidadConfigRepository.updateSettings(body),
    onSuccess: async () => {
      await invalidateContabilidadConfigCache(qc)
      void markapAlert.toast.success('Parámetros tributarios actualizados')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo guardar', getApiErrorMessage(e)),
  })
}

export function useContabilidadPatchDocumentSeries() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: {
      seriesKey: string
      body: { sunatSeries?: string; lastNumber?: number; padLength?: number; isActive?: boolean }
    }) => contabilidadConfigRepository.patchDocumentSeries(args.seriesKey, args.body),
    onSuccess: async () => {
      await invalidateContabilidadConfigCache(qc)
      void markapAlert.toast.success('Serie documental actualizada')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo guardar', getApiErrorMessage(e)),
  })
}
