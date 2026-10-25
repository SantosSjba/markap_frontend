import { produccionConfigRepositoryKey } from '../../application/ports/produccion-config.port'
import { useService } from '@shared/presentation/di/services'
import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/vue-query'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { invalidateModuleQueries } from '@shared/utils/invalidateModuleQueries'
import type {
  ProduccionAppSettingsDTO,
  ProduccionFurnitureCategoryDTO,
  ProduccionMaterialCategoryDTO,
  ProduccionProductionStageDTO,
  ProduccionUnitDTO,
} from '../../domain/config.types'
export const produccionConfigKeys = {
  root: ['produccion-config'] as const,
  bootstrap: () => [...produccionConfigKeys.root, 'bootstrap'] as const,
}

export function invalidateProduccionConfigCache(qc: QueryClient) {
  return invalidateModuleQueries(qc, 'produccion')
}

export function useProduccionConfigBootstrap() {
  const produccionConfigRepository = useService(produccionConfigRepositoryKey)
  return useQuery({
    queryKey: produccionConfigKeys.bootstrap(),
    queryFn: () => produccionConfigRepository.bootstrap(),
    staleTime: 30_000,
  })
}

export function useProduccionSaveSettings() {
  const produccionConfigRepository = useService(produccionConfigRepositoryKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Partial<ProduccionAppSettingsDTO>) =>
      produccionConfigRepository.updateSettings(body),
    onSuccess: async () => {
      await invalidateProduccionConfigCache(qc)
      void markapAlert.toast.success('Parámetros actualizados')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo guardar', getApiErrorMessage(e)),
  })
}

export function useProduccionSaveFurnitureCategories() {
  const produccionConfigRepository = useService(produccionConfigRepositoryKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (categories: ProduccionFurnitureCategoryDTO[]) =>
      produccionConfigRepository.replaceFurnitureCategories(categories),
    onSuccess: async () => {
      await invalidateProduccionConfigCache(qc)
      void markapAlert.toast.success('Categorías actualizadas')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo guardar', getApiErrorMessage(e)),
  })
}

export function useProduccionSaveMaterialCategories() {
  const produccionConfigRepository = useService(produccionConfigRepositoryKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (categories: ProduccionMaterialCategoryDTO[]) =>
      produccionConfigRepository.replaceMaterialCategories(categories),
    onSuccess: async () => {
      await invalidateProduccionConfigCache(qc)
      void markapAlert.toast.success('Categorías de materiales actualizadas')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo guardar', getApiErrorMessage(e)),
  })
}

export function useProduccionSaveProductionStages() {
  const produccionConfigRepository = useService(produccionConfigRepositoryKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (stages: ProduccionProductionStageDTO[]) =>
      produccionConfigRepository.replaceProductionStages(stages),
    onSuccess: async () => {
      await invalidateProduccionConfigCache(qc)
      void markapAlert.toast.success('Etapas actualizadas')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo guardar', getApiErrorMessage(e)),
  })
}

export function useProduccionSaveUnits() {
  const produccionConfigRepository = useService(produccionConfigRepositoryKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (units: ProduccionUnitDTO[]) => produccionConfigRepository.replaceUnits(units),
    onSuccess: async () => {
      await invalidateProduccionConfigCache(qc)
      void markapAlert.toast.success('Unidades actualizadas')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo guardar', getApiErrorMessage(e)),
  })
}

export function useProduccionPatchNumbering() {
  const produccionConfigRepository = useService(produccionConfigRepositoryKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: {
      seriesKey: string
      body: { prefix?: string; lastNumber?: number; padLength?: number; includeYear?: boolean }
    }) => produccionConfigRepository.patchNumbering(args.seriesKey, args.body),
    onSuccess: async () => {
      await invalidateProduccionConfigCache(qc)
      void markapAlert.toast.success('Numeración actualizada')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo guardar', getApiErrorMessage(e)),
  })
}
