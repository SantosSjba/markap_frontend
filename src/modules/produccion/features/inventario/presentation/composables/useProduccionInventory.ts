import { produccionInventoryRepositoryKey } from '../../application/ports/inventory.port'
import { useService } from '@shared/presentation/di/services'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { invalidateModuleQueries } from '@shared/utils/invalidateModuleQueries'
import { PRODUCCION_APP_SLUG } from '../../../../config/app.constants'
import type {
  CreateMaterialPayload,
  CreateMovementPayload,
  ListMaterialsParams,
  ListMovementsParams,
  UpdateMaterialPayload,
} from '../../domain/inventory.types'
export const produccionInventoryKeys = {
  all: ['produccion-inventory', PRODUCCION_APP_SLUG] as const,
  materials: (p: ListMaterialsParams) => [...produccionInventoryKeys.all, 'materials', p] as const,
  stats: () => [...produccionInventoryKeys.all, 'stats'] as const,
  movements: (p: ListMovementsParams) => [...produccionInventoryKeys.all, 'movements', p] as const,
}

export function useProduccionMaterialsList(params: Ref<ListMaterialsParams>) {
  const produccionInventoryApi = useService(produccionInventoryRepositoryKey)
  return useQuery({
    queryKey: computed(() => produccionInventoryKeys.materials(params.value)),
    queryFn: () => produccionInventoryApi.listMaterials(params.value),
  })
}

export function useProduccionInventoryStats() {
  const produccionInventoryApi = useService(produccionInventoryRepositoryKey)
  return useQuery({
    queryKey: produccionInventoryKeys.stats(),
    queryFn: () => produccionInventoryApi.getStats(),
  })
}

export function useProduccionMovementsList(params: Ref<ListMovementsParams>) {
  const produccionInventoryApi = useService(produccionInventoryRepositoryKey)
  return useQuery({
    queryKey: computed(() => produccionInventoryKeys.movements(params.value)),
    queryFn: () => produccionInventoryApi.listMovements(params.value),
  })
}

export function useMaterialMutations() {
  const produccionInventoryApi = useService(produccionInventoryRepositoryKey)
  const qc = useQueryClient()
  const invalidate = () => invalidateModuleQueries(qc, 'produccion')

  const create = useMutation({
    mutationFn: (payload: CreateMaterialPayload) => produccionInventoryApi.createMaterial(payload),
    onSuccess: async () => {
      await invalidate()
      void markapAlert.toast.success('Material creado')
    },
    onError: (err) => {
      void markapAlert.toast.error('Error', getApiErrorMessage(err))
    },
  })
  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateMaterialPayload }) =>
      produccionInventoryApi.updateMaterial(id, payload),
    onSuccess: async () => {
      await invalidate()
      void markapAlert.toast.success('Material actualizado')
    },
    onError: (err) => {
      void markapAlert.toast.error('Error', getApiErrorMessage(err))
    },
  })
  const remove = useMutation({
    mutationFn: (id: string) => produccionInventoryApi.deleteMaterial(id),
    onSuccess: async () => {
      await invalidate()
      void markapAlert.toast.success('Material eliminado')
    },
    onError: (err) => {
      void markapAlert.toast.error('Error', getApiErrorMessage(err))
    },
  })

  return { create, update, remove }
}

export function useMovementMutations() {
  const produccionInventoryApi = useService(produccionInventoryRepositoryKey)
  const qc = useQueryClient()
  const invalidate = () => invalidateModuleQueries(qc, 'produccion')

  return useMutation({
    mutationFn: (payload: CreateMovementPayload) => produccionInventoryApi.createMovement(payload),
    onSuccess: async () => {
      await invalidate()
      void markapAlert.toast.success('Movimiento registrado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo registrar el movimiento', getApiErrorMessage(err))
    },
  })
}
