import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, unref, type Ref } from 'vue'
import { markapAlert } from '@/shared/composables'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import { invalidateQuerySubtree } from '@/shared/utils/invalidateQuerySubtree'
import { PRODUCCION_APP_SLUG } from '@modules/produccion/config/app.constants'
import type {
  CreateProduccionFurniturePayload,
  ListProduccionFurnitureParams,
  UpdateProduccionFurniturePayload,
} from '../domain/catalog.types'
import { produccionCatalogApiRepository as repo } from '../infrastructure/catalog.api.repository'

export const produccionCatalogKeys = {
  all: ['produccion-furniture', PRODUCCION_APP_SLUG] as const,
  list: (p: ListProduccionFurnitureParams) => [...produccionCatalogKeys.all, 'list', p] as const,
  stats: () => [...produccionCatalogKeys.all, 'stats'] as const,
  detail: (id: string) => [...produccionCatalogKeys.all, 'detail', id] as const,
}

export function useProduccionCatalogList(params: Ref<ListProduccionFurnitureParams>) {
  return useQuery({
    queryKey: computed(() => produccionCatalogKeys.list(params.value)),
    queryFn: () => repo.getList(params.value),
  })
}

export function useProduccionCatalogStats() {
  return useQuery({
    queryKey: produccionCatalogKeys.stats(),
    queryFn: () => repo.getStats(),
  })
}

export function useProduccionCatalogDetail(id: Ref<string> | string) {
  return useQuery({
    queryKey: computed(() => produccionCatalogKeys.detail(unref(id))),
    queryFn: () => repo.getById(unref(id)),
    enabled: computed(() => !!unref(id)),
  })
}

export function useCreateProduccionCatalogItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateProduccionFurniturePayload) => repo.create(payload),
    onSuccess: () => {
      invalidateQuerySubtree(qc, produccionCatalogKeys.all)
      void markapAlert.toast.success('Mueble creado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo crear el mueble', getApiErrorMessage(err))
    },
  })
}

export function useUpdateProduccionCatalogItem(id: Ref<string> | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateProduccionFurniturePayload) => repo.update(unref(id), payload),
    onSuccess: () => {
      invalidateQuerySubtree(qc, produccionCatalogKeys.all)
      void markapAlert.toast.success('Mueble guardado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo guardar', getApiErrorMessage(err))
    },
  })
}

export function useDeleteProduccionCatalogItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (itemId: string) => repo.delete(itemId),
    onSuccess: () => {
      invalidateQuerySubtree(qc, produccionCatalogKeys.all)
      void markapAlert.toast.success('Mueble eliminado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo eliminar', getApiErrorMessage(err))
    },
  })
}
