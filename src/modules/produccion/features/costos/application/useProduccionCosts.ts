import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, unref, type Ref } from 'vue'
import { markapAlert } from '@/shared/composables'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import { invalidateQuerySubtree } from '@/shared/utils/invalidateQuerySubtree'
import { PRODUCCION_APP_SLUG } from '@modules/produccion/config/app.constants'
import type { ListExtraCostsParams, ListLaborRatesParams, UpdateFurnitureCostingPayload } from '../domain/costs.types'
import { produccionCostsApi } from '../infrastructure/costs.api.repository'

export const produccionCostsKeys = {
  all: ['produccion-costs', PRODUCCION_APP_SLUG] as const,
  labor: (p: ListLaborRatesParams) => [...produccionCostsKeys.all, 'labor', p] as const,
  extras: (p: ListExtraCostsParams) => [...produccionCostsKeys.all, 'extras', p] as const,
  costing: (id: string) => [...produccionCostsKeys.all, 'costing', id] as const,
}

export function useProduccionLaborRatesList(params: Ref<ListLaborRatesParams>) {
  return useQuery({
    queryKey: computed(() => produccionCostsKeys.labor(params.value)),
    queryFn: () => produccionCostsApi.listLaborRates(params.value),
  })
}

export function useProduccionExtraCostsList(params: Ref<ListExtraCostsParams>) {
  return useQuery({
    queryKey: computed(() => produccionCostsKeys.extras(params.value)),
    queryFn: () => produccionCostsApi.listExtraCosts(params.value),
  })
}

export function useProduccionFurnitureCosting(furnitureId: Ref<string> | string) {
  return useQuery({
    queryKey: computed(() => produccionCostsKeys.costing(unref(furnitureId))),
    queryFn: () => produccionCostsApi.getCosting(unref(furnitureId)),
    enabled: computed(() => !!unref(furnitureId)),
  })
}

export function useUpdateProduccionFurnitureCosting(furnitureId: Ref<string> | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateFurnitureCostingPayload) =>
      produccionCostsApi.updateCosting(unref(furnitureId), payload),
    onSuccess: () => {
      invalidateQuerySubtree(qc, produccionCostsKeys.all)
      void markapAlert.toast.success('Costeo guardado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo guardar el costeo', getApiErrorMessage(err))
    },
  })
}

export function useCreateCostingSnapshot(furnitureId: Ref<string> | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (label?: string) => produccionCostsApi.createSnapshot(unref(furnitureId), label),
    onSuccess: () => {
      invalidateQuerySubtree(qc, produccionCostsKeys.costing(unref(furnitureId)))
      void markapAlert.toast.success('Snapshot de costeo guardado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo guardar el snapshot', getApiErrorMessage(err))
    },
  })
}

export function useLaborRateMutations() {
  const qc = useQueryClient()
  const invalidate = () => invalidateQuerySubtree(qc, produccionCostsKeys.all)

  const create = useMutation({
    mutationFn: produccionCostsApi.createLaborRate,
    onSuccess: () => { invalidate(); void markapAlert.toast.success('Tarifa creada') },
    onError: (err) => { void markapAlert.toast.error('Error', getApiErrorMessage(err)) },
  })
  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof produccionCostsApi.updateLaborRate>[1] }) =>
      produccionCostsApi.updateLaborRate(id, payload),
    onSuccess: () => { invalidate(); void markapAlert.toast.success('Tarifa actualizada') },
    onError: (err) => { void markapAlert.toast.error('Error', getApiErrorMessage(err)) },
  })
  const remove = useMutation({
    mutationFn: produccionCostsApi.deleteLaborRate,
    onSuccess: () => { invalidate(); void markapAlert.toast.success('Tarifa eliminada') },
    onError: (err) => { void markapAlert.toast.error('Error', getApiErrorMessage(err)) },
  })
  return { create, update, remove }
}

export function useExtraCostMutations() {
  const qc = useQueryClient()
  const invalidate = () => invalidateQuerySubtree(qc, produccionCostsKeys.all)

  const create = useMutation({
    mutationFn: produccionCostsApi.createExtraCost,
    onSuccess: () => { invalidate(); void markapAlert.toast.success('Gasto creado') },
    onError: (err) => { void markapAlert.toast.error('Error', getApiErrorMessage(err)) },
  })
  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof produccionCostsApi.updateExtraCost>[1] }) =>
      produccionCostsApi.updateExtraCost(id, payload),
    onSuccess: () => { invalidate(); void markapAlert.toast.success('Gasto actualizado') },
    onError: (err) => { void markapAlert.toast.error('Error', getApiErrorMessage(err)) },
  })
  const remove = useMutation({
    mutationFn: produccionCostsApi.deleteExtraCost,
    onSuccess: () => { invalidate(); void markapAlert.toast.success('Gasto eliminado') },
    onError: (err) => { void markapAlert.toast.error('Error', getApiErrorMessage(err)) },
  })
  return { create, update, remove }
}
