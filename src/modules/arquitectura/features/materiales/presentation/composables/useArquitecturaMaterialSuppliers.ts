import { arquitecturaMaterialSuppliersRepositoryKey as repoKey } from '../../application/ports/material-suppliers.port'
import { useService } from '@shared/presentation/di/services'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, unref, type Ref } from 'vue'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { invalidateModuleQueries } from '@shared/utils/invalidateModuleQueries'
import { ARQUITECTURA_APP_SLUG } from '../../../../config/app.constants'
import type {
  CreateArquitecturaMaterialSupplierPayload,
  LinkSupplierCatalogPayload,
  ListArquitecturaMaterialSuppliersParams,
  RecordArquitecturaMaterialPurchasePayload,
  UpdateArquitecturaMaterialSupplierPayload,
} from '../../domain/suppliers.types'
export const arquitecturaMaterialSuppliersKeys = {
  all: ['arquitectura-material-suppliers', ARQUITECTURA_APP_SLUG] as const,
  list: (p: ListArquitecturaMaterialSuppliersParams) =>
    [...arquitecturaMaterialSuppliersKeys.all, 'list', p] as const,
  detail: (id: string) => [...arquitecturaMaterialSuppliersKeys.all, 'detail', id] as const,
}

export function useArquitecturaMaterialSuppliersList(
  params: Ref<ListArquitecturaMaterialSuppliersParams>,
) {
  const repo = useService(repoKey)
  return useQuery({
    queryKey: computed(() => arquitecturaMaterialSuppliersKeys.list(params.value)),
    queryFn: () => repo.getList(params.value),
  })
}

export function useArquitecturaMaterialSupplierDetail(id: Ref<string> | string) {
  const repo = useService(repoKey)
  return useQuery({
    queryKey: computed(() => arquitecturaMaterialSuppliersKeys.detail(unref(id))),
    queryFn: () => repo.getById(unref(id)),
    enabled: computed(() => !!unref(id)),
  })
}

export function useCreateArquitecturaMaterialSupplier() {
  const repo = useService(repoKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateArquitecturaMaterialSupplierPayload) => repo.create(payload),
    onSuccess: async () => {
      await invalidateModuleQueries(qc, 'arquitectura')
      void markapAlert.toast.success('Proveedor creado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo crear el proveedor', getApiErrorMessage(err))
    },
  })
}

export function useUpdateArquitecturaMaterialSupplier(id: Ref<string> | string) {
  const repo = useService(repoKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateArquitecturaMaterialSupplierPayload) =>
      repo.update(unref(id), payload),
    onSuccess: async () => {
      await invalidateModuleQueries(qc, 'arquitectura')
      void markapAlert.toast.success('Proveedor guardado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo guardar', getApiErrorMessage(err))
    },
  })
}

export function useDeleteArquitecturaMaterialSupplier() {
  const repo = useService(repoKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (supplierId: string) => repo.delete(supplierId),
    onSuccess: async () => {
      await invalidateModuleQueries(qc, 'arquitectura')
      void markapAlert.toast.success('Proveedor eliminado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo eliminar', getApiErrorMessage(err))
    },
  })
}

export function useLinkArquitecturaSupplierCatalog(supplierId: Ref<string> | string) {
  const repo = useService(repoKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: LinkSupplierCatalogPayload) =>
      repo.linkCatalogMaterial(unref(supplierId), payload),
    onSuccess: async () => {
      await invalidateModuleQueries(qc, 'arquitectura')
      void markapAlert.toast.success('Material vinculado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo vincular', getApiErrorMessage(err))
    },
  })
}

export function useUnlinkArquitecturaSupplierCatalog() {
  const repo = useService(repoKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (linkId: string) => repo.unlinkCatalogLink(linkId),
    onSuccess: async () => {
      await invalidateModuleQueries(qc, 'arquitectura')
      void markapAlert.toast.success('Vínculo eliminado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo quitar el vínculo', getApiErrorMessage(err))
    },
  })
}

export function useRecordArquitecturaMaterialPurchase(supplierId: Ref<string> | string) {
  const repo = useService(repoKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: RecordArquitecturaMaterialPurchasePayload) =>
      repo.recordPurchase(unref(supplierId), payload),
    onSuccess: async () => {
      await invalidateModuleQueries(qc, 'arquitectura')
      void markapAlert.toast.success('Compra registrada')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo registrar la compra', getApiErrorMessage(err))
    },
  })
}
