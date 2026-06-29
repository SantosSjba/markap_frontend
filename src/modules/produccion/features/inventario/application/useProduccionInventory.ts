import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { markapAlert } from '@/shared/composables'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import { invalidateQuerySubtree } from '@/shared/utils/invalidateQuerySubtree'
import { PRODUCCION_APP_SLUG } from '@modules/produccion/config/app.constants'
import type {
  CreateMaterialPayload,
  CreateMovementPayload,
  ListMaterialsParams,
  ListMovementsParams,
  UpdateMaterialPayload,
} from '../domain/inventory.types'
import { produccionInventoryApi } from '../infrastructure/inventory.api.repository'

export const produccionInventoryKeys = {
  all: ['produccion-inventory', PRODUCCION_APP_SLUG] as const,
  materials: (p: ListMaterialsParams) => [...produccionInventoryKeys.all, 'materials', p] as const,
  stats: () => [...produccionInventoryKeys.all, 'stats'] as const,
  movements: (p: ListMovementsParams) => [...produccionInventoryKeys.all, 'movements', p] as const,
}

export function useProduccionMaterialsList(params: Ref<ListMaterialsParams>) {
  return useQuery({
    queryKey: computed(() => produccionInventoryKeys.materials(params.value)),
    queryFn: () => produccionInventoryApi.listMaterials(params.value),
  })
}

export function useProduccionInventoryStats() {
  return useQuery({
    queryKey: produccionInventoryKeys.stats(),
    queryFn: () => produccionInventoryApi.getStats(),
  })
}

export function useProduccionMovementsList(params: Ref<ListMovementsParams>) {
  return useQuery({
    queryKey: computed(() => produccionInventoryKeys.movements(params.value)),
    queryFn: () => produccionInventoryApi.listMovements(params.value),
  })
}

export function useMaterialMutations() {
  const qc = useQueryClient()
  const invalidate = () => invalidateQuerySubtree(qc, produccionInventoryKeys.all)

  const create = useMutation({
    mutationFn: (payload: CreateMaterialPayload) => produccionInventoryApi.createMaterial(payload),
    onSuccess: () => { invalidate(); void markapAlert.toast.success('Material creado') },
    onError: (err) => { void markapAlert.toast.error('Error', getApiErrorMessage(err)) },
  })
  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateMaterialPayload }) =>
      produccionInventoryApi.updateMaterial(id, payload),
    onSuccess: () => { invalidate(); void markapAlert.toast.success('Material actualizado') },
    onError: (err) => { void markapAlert.toast.error('Error', getApiErrorMessage(err)) },
  })
  const remove = useMutation({
    mutationFn: (id: string) => produccionInventoryApi.deleteMaterial(id),
    onSuccess: () => { invalidate(); void markapAlert.toast.success('Material eliminado') },
    onError: (err) => { void markapAlert.toast.error('Error', getApiErrorMessage(err)) },
  })

  return { create, update, remove }
}

export function useMovementMutations() {
  const qc = useQueryClient()
  const invalidate = () => invalidateQuerySubtree(qc, produccionInventoryKeys.all)

  return useMutation({
    mutationFn: (payload: CreateMovementPayload) => produccionInventoryApi.createMovement(payload),
    onSuccess: () => {
      invalidate()
      void markapAlert.toast.success('Movimiento registrado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo registrar el movimiento', getApiErrorMessage(err))
    },
  })
}
