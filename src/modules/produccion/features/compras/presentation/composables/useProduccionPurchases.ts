import { produccionPurchasesRepositoryKey } from '../../application/ports/purchases.port'
import { useService } from '@shared/presentation/di/services'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, unref, type Ref } from 'vue'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { invalidateModuleQueries } from '@shared/utils/invalidateModuleQueries'
import { PRODUCCION_APP_SLUG } from '../../../../config/app.constants'
import type {
  CreatePurchaseOrderPayload,
  CreateSupplierPayload,
  ListPurchaseOrdersParams,
  ListSuppliersParams,
  ReceivePurchaseOrderPayload,
} from '../../domain/purchases.types'
export const produccionPurchasesKeys = {
  all: ['produccion-purchases', PRODUCCION_APP_SLUG] as const,
  suppliers: (p: ListSuppliersParams) => [...produccionPurchasesKeys.all, 'suppliers', p] as const,
  supplier: (id: string) => [...produccionPurchasesKeys.all, 'supplier', id] as const,
  orders: (p: ListPurchaseOrdersParams) => [...produccionPurchasesKeys.all, 'orders', p] as const,
  order: (id: string) => [...produccionPurchasesKeys.all, 'order', id] as const,
}

export function useProduccionSuppliersList(params: Ref<ListSuppliersParams>) {
  const produccionPurchasesApi = useService(produccionPurchasesRepositoryKey)
  return useQuery({
    queryKey: computed(() => produccionPurchasesKeys.suppliers(params.value)),
    queryFn: () => produccionPurchasesApi.listSuppliers(params.value),
  })
}

export function useProduccionSupplierDetail(id: Ref<string> | string) {
  const produccionPurchasesApi = useService(produccionPurchasesRepositoryKey)
  return useQuery({
    queryKey: computed(() => produccionPurchasesKeys.supplier(unref(id))),
    queryFn: () => produccionPurchasesApi.getSupplier(unref(id)),
    enabled: computed(() => !!unref(id)),
  })
}

export function useProduccionPurchaseOrdersList(params: Ref<ListPurchaseOrdersParams>) {
  const produccionPurchasesApi = useService(produccionPurchasesRepositoryKey)
  return useQuery({
    queryKey: computed(() => produccionPurchasesKeys.orders(params.value)),
    queryFn: () => produccionPurchasesApi.listPurchaseOrders(params.value),
  })
}

export function useProduccionPurchaseOrderDetail(id: Ref<string> | string) {
  const produccionPurchasesApi = useService(produccionPurchasesRepositoryKey)
  return useQuery({
    queryKey: computed(() => produccionPurchasesKeys.order(unref(id))),
    queryFn: () => produccionPurchasesApi.getPurchaseOrder(unref(id)),
    enabled: computed(() => !!unref(id)),
  })
}

export function useSupplierMutations() {
  const produccionPurchasesApi = useService(produccionPurchasesRepositoryKey)
  const qc = useQueryClient()
  const invalidate = () => invalidateModuleQueries(qc, 'produccion')

  const create = useMutation({
    mutationFn: (payload: CreateSupplierPayload) => produccionPurchasesApi.createSupplier(payload),
    onSuccess: async () => {
      await invalidate()
      void markapAlert.toast.success('Proveedor creado')
    },
    onError: (err) => {
      void markapAlert.toast.error('Error', getApiErrorMessage(err))
    },
  })
  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateSupplierPayload> }) =>
      produccionPurchasesApi.updateSupplier(id, payload),
    onSuccess: async () => {
      await invalidate()
      void markapAlert.toast.success('Proveedor actualizado')
    },
    onError: (err) => {
      void markapAlert.toast.error('Error', getApiErrorMessage(err))
    },
  })
  const remove = useMutation({
    mutationFn: (id: string) => produccionPurchasesApi.deleteSupplier(id),
    onSuccess: async () => {
      await invalidate()
      void markapAlert.toast.success('Proveedor eliminado')
    },
    onError: (err) => {
      void markapAlert.toast.error('Error', getApiErrorMessage(err))
    },
  })
  const linkMaterial = useMutation({
    mutationFn: ({
      supplierId,
      materialId,
      supplierSku,
      notes,
    }: {
      supplierId: string
      materialId: string
      supplierSku?: string | null
      notes?: string | null
    }) =>
      produccionPurchasesApi.linkSupplierMaterial(supplierId, { materialId, supplierSku, notes }),
    onSuccess: async () => {
      await invalidate()
      void markapAlert.toast.success('Material vinculado')
    },
    onError: (err) => {
      void markapAlert.toast.error('Error', getApiErrorMessage(err))
    },
  })
  const unlinkMaterial = useMutation({
    mutationFn: (linkId: string) => produccionPurchasesApi.unlinkSupplierMaterial(linkId),
    onSuccess: async () => {
      await invalidate()
      void markapAlert.toast.success('Vínculo eliminado')
    },
    onError: (err) => {
      void markapAlert.toast.error('Error', getApiErrorMessage(err))
    },
  })

  return { create, update, remove, linkMaterial, unlinkMaterial }
}

export function usePurchaseOrderMutations() {
  const produccionPurchasesApi = useService(produccionPurchasesRepositoryKey)
  const qc = useQueryClient()
  const invalidate = () => {
    invalidateModuleQueries(qc, 'produccion')
  }

  const create = useMutation({
    mutationFn: (payload: CreatePurchaseOrderPayload) =>
      produccionPurchasesApi.createPurchaseOrder(payload),
    onSuccess: async () => {
      await invalidate()
      void markapAlert.toast.success('Orden creada')
    },
    onError: (err) => {
      void markapAlert.toast.error('Error', getApiErrorMessage(err))
    },
  })
  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreatePurchaseOrderPayload> }) =>
      produccionPurchasesApi.updatePurchaseOrder(id, payload),
    onSuccess: async () => {
      await invalidate()
      void markapAlert.toast.success('Orden actualizada')
    },
    onError: (err) => {
      void markapAlert.toast.error('Error', getApiErrorMessage(err))
    },
  })
  const send = useMutation({
    mutationFn: (id: string) => produccionPurchasesApi.sendPurchaseOrder(id),
    onSuccess: async () => {
      await invalidate()
      void markapAlert.toast.success('Orden enviada')
    },
    onError: (err) => {
      void markapAlert.toast.error('Error', getApiErrorMessage(err))
    },
  })
  const receive = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ReceivePurchaseOrderPayload }) =>
      produccionPurchasesApi.receivePurchaseOrder(id, payload),
    onSuccess: async () => {
      await invalidate()
      void markapAlert.toast.success('Recepción registrada')
    },
    onError: (err) => {
      void markapAlert.toast.error('Error en recepción', getApiErrorMessage(err))
    },
  })
  const cancel = useMutation({
    mutationFn: (id: string) => produccionPurchasesApi.cancelPurchaseOrder(id),
    onSuccess: async () => {
      await invalidate()
      void markapAlert.toast.success('Orden cancelada')
    },
    onError: (err) => {
      void markapAlert.toast.error('Error', getApiErrorMessage(err))
    },
  })
  const remove = useMutation({
    mutationFn: (id: string) => produccionPurchasesApi.deletePurchaseOrder(id),
    onSuccess: async () => {
      await invalidate()
      void markapAlert.toast.success('Orden eliminada')
    },
    onError: (err) => {
      void markapAlert.toast.error('Error', getApiErrorMessage(err))
    },
  })

  return { create, update, send, receive, cancel, remove }
}
