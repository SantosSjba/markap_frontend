import { produccionWorkOrdersRepositoryKey } from '../../application/ports/work-orders.port'
import { useService } from '@shared/presentation/di/services'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, unref, type Ref } from 'vue'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { invalidateModuleQueries } from '@shared/utils/invalidateModuleQueries'
import { PRODUCCION_APP_SLUG } from '../../../../config/app.constants'
import type { CreateWorkOrderPayload, ListWorkOrdersParams } from '../../domain/work-orders.types'
export const produccionWorkOrdersKeys = {
  all: ['produccion-work-orders', PRODUCCION_APP_SLUG] as const,
  list: (p: ListWorkOrdersParams) => [...produccionWorkOrdersKeys.all, 'list', p] as const,
  stats: () => [...produccionWorkOrdersKeys.all, 'stats'] as const,
  detail: (id: string) => [...produccionWorkOrdersKeys.all, 'detail', id] as const,
}

export function useProduccionWorkOrdersList(params: Ref<ListWorkOrdersParams>) {
  const produccionWorkOrdersApi = useService(produccionWorkOrdersRepositoryKey)
  return useQuery({
    queryKey: computed(() => produccionWorkOrdersKeys.list(params.value)),
    queryFn: () => produccionWorkOrdersApi.list(params.value),
  })
}

export function useProduccionWorkOrderStats() {
  const produccionWorkOrdersApi = useService(produccionWorkOrdersRepositoryKey)
  return useQuery({
    queryKey: produccionWorkOrdersKeys.stats(),
    queryFn: () => produccionWorkOrdersApi.getStats(),
  })
}

export function useProduccionWorkOrderDetail(id: Ref<string> | string) {
  const produccionWorkOrdersApi = useService(produccionWorkOrdersRepositoryKey)
  return useQuery({
    queryKey: computed(() => produccionWorkOrdersKeys.detail(unref(id))),
    queryFn: () => produccionWorkOrdersApi.getById(unref(id)),
    enabled: computed(() => !!unref(id)),
  })
}

export function useWorkOrderMutations() {
  const produccionWorkOrdersApi = useService(produccionWorkOrdersRepositoryKey)
  const qc = useQueryClient()
  const invalidate = () => {
    invalidateModuleQueries(qc, 'produccion')
  }

  const create = useMutation({
    mutationFn: (payload: CreateWorkOrderPayload) => produccionWorkOrdersApi.create(payload),
    onSuccess: async () => {
      await invalidate()
      void markapAlert.toast.success('OT creada')
    },
    onError: (err) => {
      void markapAlert.toast.error('Error', getApiErrorMessage(err))
    },
  })
  const start = useMutation({
    mutationFn: (id: string) => produccionWorkOrdersApi.start(id),
    onSuccess: async () => {
      await invalidate()
      void markapAlert.toast.success('Producción iniciada')
    },
    onError: (err) => {
      void markapAlert.toast.error('Error', getApiErrorMessage(err))
    },
  })
  const updateStage = useMutation({
    mutationFn: ({
      id,
      stageId,
      payload,
    }: {
      id: string
      stageId: string
      payload: { assignee?: string | null; notes?: string | null; markDone?: boolean }
    }) => produccionWorkOrdersApi.updateStage(id, stageId, payload),
    onSuccess: async () => {
      await invalidate()
      void markapAlert.toast.success('Etapa actualizada')
    },
    onError: (err) => {
      void markapAlert.toast.error('Error', getApiErrorMessage(err))
    },
  })
  const complete = useMutation({
    mutationFn: (id: string) => produccionWorkOrdersApi.complete(id),
    onSuccess: async () => {
      await invalidate()
      void markapAlert.toast.success('OT completada')
    },
    onError: (err) => {
      void markapAlert.toast.error('Error', getApiErrorMessage(err))
    },
  })
  const cancel = useMutation({
    mutationFn: (id: string) => produccionWorkOrdersApi.cancel(id),
    onSuccess: async () => {
      await invalidate()
      void markapAlert.toast.success('OT cancelada')
    },
    onError: (err) => {
      void markapAlert.toast.error('Error', getApiErrorMessage(err))
    },
  })
  const consumeMaterials = useMutation({
    mutationFn: ({
      id,
      items,
    }: {
      id: string
      items: { materialId: string; quantity: number; notes?: string | null }[]
    }) => produccionWorkOrdersApi.consumeMaterials(id, items),
    onSuccess: async () => {
      await invalidate()
      void markapAlert.toast.success('Consumo registrado')
    },
    onError: (err) => {
      void markapAlert.toast.error('Error en consumo', getApiErrorMessage(err))
    },
  })
  const remove = useMutation({
    mutationFn: (id: string) => produccionWorkOrdersApi.delete(id),
    onSuccess: async () => {
      await invalidate()
      void markapAlert.toast.success('OT eliminada')
    },
    onError: (err) => {
      void markapAlert.toast.error('Error', getApiErrorMessage(err))
    },
  })

  return { create, start, updateStage, complete, cancel, consumeMaterials, remove }
}
