import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, unref, type Ref } from 'vue'
import { markapAlert } from '@/shared/composables'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import { invalidateQuerySubtree } from '@/shared/utils/invalidateQuerySubtree'
import { PRODUCCION_APP_SLUG } from '@modules/produccion/config/app.constants'
import type {
  CreateDeliveryPayload,
  CreateQuotationPayload,
  ListDeliveriesParams,
  ListOrdersParams,
  ListQuotationsParams,
} from '../domain/sales.types'
import { produccionSalesApi } from '../infrastructure/sales.api.repository'

export const produccionSalesKeys = {
  all: ['produccion-sales', PRODUCCION_APP_SLUG] as const,
  quotations: (p: ListQuotationsParams) => [...produccionSalesKeys.all, 'quotations', p] as const,
  quotation: (id: string) => [...produccionSalesKeys.all, 'quotation', id] as const,
  orders: (p: ListOrdersParams) => [...produccionSalesKeys.all, 'orders', p] as const,
  order: (id: string) => [...produccionSalesKeys.all, 'order', id] as const,
  deliveries: (p: ListDeliveriesParams) => [...produccionSalesKeys.all, 'deliveries', p] as const,
  delivery: (id: string) => [...produccionSalesKeys.all, 'delivery', id] as const,
}

export function useProduccionQuotationsList(params: Ref<ListQuotationsParams>) {
  return useQuery({
    queryKey: computed(() => produccionSalesKeys.quotations(params.value)),
    queryFn: () => produccionSalesApi.listQuotations(params.value),
  })
}

export function useProduccionQuotationDetail(id: Ref<string> | string) {
  return useQuery({
    queryKey: computed(() => produccionSalesKeys.quotation(unref(id))),
    queryFn: () => produccionSalesApi.getQuotation(unref(id)),
    enabled: computed(() => !!unref(id)),
  })
}

export function useProduccionOrdersList(params: Ref<ListOrdersParams>) {
  return useQuery({
    queryKey: computed(() => produccionSalesKeys.orders(params.value)),
    queryFn: () => produccionSalesApi.listOrders(params.value),
  })
}

export function useProduccionOrderDetail(id: Ref<string> | string) {
  return useQuery({
    queryKey: computed(() => produccionSalesKeys.order(unref(id))),
    queryFn: () => produccionSalesApi.getOrder(unref(id)),
    enabled: computed(() => !!unref(id)),
  })
}

export function useProduccionDeliveriesList(params: Ref<ListDeliveriesParams>) {
  return useQuery({
    queryKey: computed(() => produccionSalesKeys.deliveries(params.value)),
    queryFn: () => produccionSalesApi.listDeliveries(params.value),
  })
}

export function useProduccionDeliveryDetail(id: Ref<string> | string) {
  return useQuery({
    queryKey: computed(() => produccionSalesKeys.delivery(unref(id))),
    queryFn: () => produccionSalesApi.getDelivery(unref(id)),
    enabled: computed(() => !!unref(id)),
  })
}

export function useQuotationMutations() {
  const qc = useQueryClient()
  const invalidate = () => invalidateQuerySubtree(qc, produccionSalesKeys.all)

  const create = useMutation({
    mutationFn: (payload: CreateQuotationPayload) => produccionSalesApi.createQuotation(payload),
    onSuccess: invalidate,
    onError: (e) => markapAlert.error(getApiErrorMessage(e)),
  })

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateQuotationPayload> }) =>
      produccionSalesApi.updateQuotation(id, payload),
    onSuccess: invalidate,
    onError: (e) => markapAlert.error(getApiErrorMessage(e)),
  })

  const send = useMutation({
    mutationFn: (id: string) => produccionSalesApi.sendQuotation(id),
    onSuccess: invalidate,
    onError: (e) => markapAlert.error(getApiErrorMessage(e)),
  })

  const accept = useMutation({
    mutationFn: (id: string) => produccionSalesApi.acceptQuotation(id),
    onSuccess: invalidate,
    onError: (e) => markapAlert.error(getApiErrorMessage(e)),
  })

  const reject = useMutation({
    mutationFn: (id: string) => produccionSalesApi.rejectQuotation(id),
    onSuccess: invalidate,
    onError: (e) => markapAlert.error(getApiErrorMessage(e)),
  })

  const convertToOrder = useMutation({
    mutationFn: (id: string) => produccionSalesApi.convertQuotationToOrder(id),
    onSuccess: invalidate,
    onError: (e) => markapAlert.error(getApiErrorMessage(e)),
  })

  const remove = useMutation({
    mutationFn: (id: string) => produccionSalesApi.deleteQuotation(id),
    onSuccess: invalidate,
    onError: (e) => markapAlert.error(getApiErrorMessage(e)),
  })

  return { create, update, send, accept, reject, convertToOrder, remove }
}

export function useOrderMutations() {
  const qc = useQueryClient()
  const invalidate = () => invalidateQuerySubtree(qc, produccionSalesKeys.all)

  const confirm = useMutation({
    mutationFn: (id: string) => produccionSalesApi.confirmOrder(id),
    onSuccess: invalidate,
    onError: (e) => markapAlert.error(getApiErrorMessage(e)),
  })

  const createWorkOrder = useMutation({
    mutationFn: (id: string) => produccionSalesApi.createWorkOrderFromOrder(id),
    onSuccess: invalidate,
    onError: (e) => markapAlert.error(getApiErrorMessage(e)),
  })

  const markReady = useMutation({
    mutationFn: (id: string) => produccionSalesApi.markOrderReady(id),
    onSuccess: invalidate,
    onError: (e) => markapAlert.error(getApiErrorMessage(e)),
  })

  const cancel = useMutation({
    mutationFn: (id: string) => produccionSalesApi.cancelOrder(id),
    onSuccess: invalidate,
    onError: (e) => markapAlert.error(getApiErrorMessage(e)),
  })

  const remove = useMutation({
    mutationFn: (id: string) => produccionSalesApi.deleteOrder(id),
    onSuccess: invalidate,
    onError: (e) => markapAlert.error(getApiErrorMessage(e)),
  })

  return { confirm, createWorkOrder, markReady, cancel, remove }
}

export function useDeliveryMutations() {
  const qc = useQueryClient()
  const invalidate = () => invalidateQuerySubtree(qc, produccionSalesKeys.all)

  const create = useMutation({
    mutationFn: (payload: CreateDeliveryPayload) => produccionSalesApi.createDelivery(payload),
    onSuccess: invalidate,
    onError: (e) => markapAlert.error(getApiErrorMessage(e)),
  })

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateDeliveryPayload> }) =>
      produccionSalesApi.updateDelivery(id, payload),
    onSuccess: invalidate,
    onError: (e) => markapAlert.error(getApiErrorMessage(e)),
  })

  const complete = useMutation({
    mutationFn: (id: string) => produccionSalesApi.completeDelivery(id),
    onSuccess: invalidate,
    onError: (e) => markapAlert.error(getApiErrorMessage(e)),
  })

  const cancel = useMutation({
    mutationFn: (id: string) => produccionSalesApi.cancelDelivery(id),
    onSuccess: invalidate,
    onError: (e) => markapAlert.error(getApiErrorMessage(e)),
  })

  const remove = useMutation({
    mutationFn: (id: string) => produccionSalesApi.deleteDelivery(id),
    onSuccess: invalidate,
    onError: (e) => markapAlert.error(getApiErrorMessage(e)),
  })

  return { create, update, complete, cancel, remove }
}
