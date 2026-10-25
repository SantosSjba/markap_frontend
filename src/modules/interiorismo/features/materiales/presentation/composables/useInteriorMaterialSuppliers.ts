import { interiorMaterialSuppliersRepositoryKey as repoKey } from '../../application/ports/material-suppliers.port'
import { useService } from '@shared/presentation/di/services'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, unref, type Ref } from 'vue'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { invalidateModuleQueries } from '@shared/utils/invalidateModuleQueries'
import { INTERIORISMO_APP_SLUG } from '../../../../config/app.constants'
import type {
  CreateInteriorMaterialSupplierPayload,
  LinkSupplierCatalogPayload,
  ListInteriorMaterialSuppliersParams,
  RecordInteriorMaterialPurchasePayload,
  UpdateInteriorMaterialSupplierPayload,
} from '../../domain/suppliers.types'
export const interiorMaterialSuppliersKeys = {
  all: ['interiorismo-material-suppliers', INTERIORISMO_APP_SLUG] as const,
  list: (p: ListInteriorMaterialSuppliersParams) =>
    [...interiorMaterialSuppliersKeys.all, 'list', p] as const,
  detail: (id: string) => [...interiorMaterialSuppliersKeys.all, 'detail', id] as const,
}

export function useInteriorMaterialSuppliersList(params: Ref<ListInteriorMaterialSuppliersParams>) {
  const repo = useService(repoKey)
  return useQuery({
    queryKey: computed(() => interiorMaterialSuppliersKeys.list(params.value)),
    queryFn: () => repo.getList(params.value),
  })
}

export function useInteriorMaterialSupplierDetail(id: Ref<string> | string) {
  const repo = useService(repoKey)
  return useQuery({
    queryKey: computed(() => interiorMaterialSuppliersKeys.detail(unref(id))),
    queryFn: () => repo.getById(unref(id)),
    enabled: computed(() => !!unref(id)),
  })
}

export function useCreateInteriorMaterialSupplier() {
  const repo = useService(repoKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateInteriorMaterialSupplierPayload) => repo.create(payload),
    onSuccess: async () => {
      await invalidateModuleQueries(qc, 'interiorismo')
      void markapAlert.toast.success('Proveedor creado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo crear el proveedor', getApiErrorMessage(err))
    },
  })
}

export function useUpdateInteriorMaterialSupplier(id: Ref<string> | string) {
  const repo = useService(repoKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateInteriorMaterialSupplierPayload) => repo.update(unref(id), payload),
    onSuccess: async () => {
      await invalidateModuleQueries(qc, 'interiorismo')
      void markapAlert.toast.success('Proveedor guardado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo guardar', getApiErrorMessage(err))
    },
  })
}

export function useDeleteInteriorMaterialSupplier() {
  const repo = useService(repoKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (supplierId: string) => repo.delete(supplierId),
    onSuccess: async () => {
      await invalidateModuleQueries(qc, 'interiorismo')
      void markapAlert.toast.success('Proveedor eliminado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo eliminar', getApiErrorMessage(err))
    },
  })
}

export function useLinkInteriorSupplierCatalog(supplierId: Ref<string> | string) {
  const repo = useService(repoKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: LinkSupplierCatalogPayload) =>
      repo.linkCatalogMaterial(unref(supplierId), payload),
    onSuccess: async () => {
      await invalidateModuleQueries(qc, 'interiorismo')
      void markapAlert.toast.success('Material vinculado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo vincular', getApiErrorMessage(err))
    },
  })
}

export function useUnlinkInteriorSupplierCatalog() {
  const repo = useService(repoKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (linkId: string) => repo.unlinkCatalogLink(linkId),
    onSuccess: async () => {
      await invalidateModuleQueries(qc, 'interiorismo')
      void markapAlert.toast.success('Vínculo eliminado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo quitar el vínculo', getApiErrorMessage(err))
    },
  })
}

export function useRecordInteriorMaterialPurchase(supplierId: Ref<string> | string) {
  const repo = useService(repoKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: RecordInteriorMaterialPurchasePayload) =>
      repo.recordPurchase(unref(supplierId), payload),
    onSuccess: async () => {
      await invalidateModuleQueries(qc, 'interiorismo')
      void markapAlert.toast.success('Compra registrada')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo registrar la compra', getApiErrorMessage(err))
    },
  })
}
