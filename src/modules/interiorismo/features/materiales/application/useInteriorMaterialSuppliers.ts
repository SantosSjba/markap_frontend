import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, unref, type Ref } from 'vue'
import { markapAlert } from '@/shared/composables'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import { invalidateQuerySubtree } from '@/shared/utils/invalidateQuerySubtree'
import { INTERIORISMO_APP_SLUG } from '@modules/interiorismo/config/app.constants'
import type {
  CreateInteriorMaterialSupplierPayload,
  LinkSupplierCatalogPayload,
  ListInteriorMaterialSuppliersParams,
  RecordInteriorMaterialPurchasePayload,
  UpdateInteriorMaterialSupplierPayload,
} from '../domain/suppliers.types'
import { interiorMaterialSuppliersApiRepository as repo } from '../infrastructure/materialSuppliers.api.repository'

export const interiorMaterialSuppliersKeys = {
  all: ['interiorismo-material-suppliers', INTERIORISMO_APP_SLUG] as const,
  list: (p: ListInteriorMaterialSuppliersParams) =>
    [...interiorMaterialSuppliersKeys.all, 'list', p] as const,
  detail: (id: string) => [...interiorMaterialSuppliersKeys.all, 'detail', id] as const,
}

export function useInteriorMaterialSuppliersList(params: Ref<ListInteriorMaterialSuppliersParams>) {
  return useQuery({
    queryKey: computed(() => interiorMaterialSuppliersKeys.list(params.value)),
    queryFn: () => repo.getList(params.value),
  })
}

export function useInteriorMaterialSupplierDetail(id: Ref<string> | string) {
  return useQuery({
    queryKey: computed(() => interiorMaterialSuppliersKeys.detail(unref(id))),
    queryFn: () => repo.getById(unref(id)),
    enabled: computed(() => !!unref(id)),
  })
}

export function useCreateInteriorMaterialSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateInteriorMaterialSupplierPayload) => repo.create(payload),
    onSuccess: () => {
      invalidateQuerySubtree(qc, interiorMaterialSuppliersKeys.all)
      void markapAlert.toast.success('Proveedor creado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo crear el proveedor', getApiErrorMessage(err))
    },
  })
}

export function useUpdateInteriorMaterialSupplier(id: Ref<string> | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateInteriorMaterialSupplierPayload) =>
      repo.update(unref(id), payload),
    onSuccess: () => {
      invalidateQuerySubtree(qc, interiorMaterialSuppliersKeys.all)
      void markapAlert.toast.success('Proveedor guardado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo guardar', getApiErrorMessage(err))
    },
  })
}

export function useDeleteInteriorMaterialSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (supplierId: string) => repo.delete(supplierId),
    onSuccess: () => {
      invalidateQuerySubtree(qc, interiorMaterialSuppliersKeys.all)
      void markapAlert.toast.success('Proveedor eliminado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo eliminar', getApiErrorMessage(err))
    },
  })
}

export function useLinkInteriorSupplierCatalog(supplierId: Ref<string> | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: LinkSupplierCatalogPayload) =>
      repo.linkCatalogMaterial(unref(supplierId), payload),
    onSuccess: () => {
      invalidateQuerySubtree(qc, interiorMaterialSuppliersKeys.all)
      void markapAlert.toast.success('Material vinculado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo vincular', getApiErrorMessage(err))
    },
  })
}

export function useUnlinkInteriorSupplierCatalog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (linkId: string) => repo.unlinkCatalogLink(linkId),
    onSuccess: () => {
      invalidateQuerySubtree(qc, interiorMaterialSuppliersKeys.all)
      void markapAlert.toast.success('Vínculo eliminado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo quitar el vínculo', getApiErrorMessage(err))
    },
  })
}

export function useRecordInteriorMaterialPurchase(supplierId: Ref<string> | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: RecordInteriorMaterialPurchasePayload) =>
      repo.recordPurchase(unref(supplierId), payload),
    onSuccess: () => {
      invalidateQuerySubtree(qc, interiorMaterialSuppliersKeys.all)
      void markapAlert.toast.success('Compra registrada')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo registrar la compra', getApiErrorMessage(err))
    },
  })
}
