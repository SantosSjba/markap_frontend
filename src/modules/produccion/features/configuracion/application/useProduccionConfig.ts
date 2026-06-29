import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/vue-query'
import { markapAlert } from '@/shared/composables'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import { invalidateQuerySubtree } from '@/shared/utils/invalidateQuerySubtree'
import type {
  ProduccionAppSettingsDTO,
  ProduccionFurnitureCategoryDTO,
  ProduccionMaterialCategoryDTO,
  ProduccionProductionStageDTO,
  ProduccionUnitDTO,
} from '../domain/config.types'
import { produccionConfigApiRepository as produccionConfigRepository } from '../infrastructure/repositories/produccion-config.api.repository'

export const produccionConfigKeys = {
  root: ['produccion-config'] as const,
  bootstrap: () => [...produccionConfigKeys.root, 'bootstrap'] as const,
}

export function invalidateProduccionConfigCache(qc: QueryClient) {
  return invalidateQuerySubtree(qc, produccionConfigKeys.root)
}

export function useProduccionConfigBootstrap() {
  return useQuery({
    queryKey: produccionConfigKeys.bootstrap(),
    queryFn: () => produccionConfigRepository.bootstrap(),
    staleTime: 30_000,
  })
}

export function useProduccionSaveSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Partial<ProduccionAppSettingsDTO>) =>
      produccionConfigRepository.updateSettings(body),
    onSuccess: () => {
      void invalidateProduccionConfigCache(qc)
      void markapAlert.toast.success('Parámetros actualizados')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo guardar', getApiErrorMessage(e)),
  })
}

export function useProduccionSaveFurnitureCategories() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (categories: ProduccionFurnitureCategoryDTO[]) =>
      produccionConfigRepository.replaceFurnitureCategories(categories),
    onSuccess: () => {
      void invalidateProduccionConfigCache(qc)
      void markapAlert.toast.success('Categorías actualizadas')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo guardar', getApiErrorMessage(e)),
  })
}

export function useProduccionSaveMaterialCategories() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (categories: ProduccionMaterialCategoryDTO[]) =>
      produccionConfigRepository.replaceMaterialCategories(categories),
    onSuccess: () => {
      void invalidateProduccionConfigCache(qc)
      void markapAlert.toast.success('Categorías de materiales actualizadas')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo guardar', getApiErrorMessage(e)),
  })
}

export function useProduccionSaveProductionStages() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (stages: ProduccionProductionStageDTO[]) =>
      produccionConfigRepository.replaceProductionStages(stages),
    onSuccess: () => {
      void invalidateProduccionConfigCache(qc)
      void markapAlert.toast.success('Etapas actualizadas')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo guardar', getApiErrorMessage(e)),
  })
}

export function useProduccionSaveUnits() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (units: ProduccionUnitDTO[]) => produccionConfigRepository.replaceUnits(units),
    onSuccess: () => {
      void invalidateProduccionConfigCache(qc)
      void markapAlert.toast.success('Unidades actualizadas')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo guardar', getApiErrorMessage(e)),
  })
}

export function useProduccionPatchNumbering() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: {
      seriesKey: string
      body: { prefix?: string; lastNumber?: number; padLength?: number; includeYear?: boolean }
    }) => produccionConfigRepository.patchNumbering(args.seriesKey, args.body),
    onSuccess: () => {
      void invalidateProduccionConfigCache(qc)
      void markapAlert.toast.success('Numeración actualizada')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo guardar', getApiErrorMessage(e)),
  })
}
