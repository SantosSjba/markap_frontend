import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, unref, type Ref } from 'vue'
import { markapAlert } from '@/shared/alert'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import { invalidateQuerySubtree, refetchQuerySubtree } from '@/shared/utils/invalidateQuerySubtree'
import {
  ventasAgentsService,
  type ListVentasAgentsParams,
  type CreateVentasAgentPayload,
  type UpdateVentasAgentPayload,
} from '../services/agents.service'

function isDeactivateOnlyUpdate(data: UpdateVentasAgentPayload): boolean {
  const entries = Object.entries(data).filter(([, v]) => v !== undefined)
  const only = entries[0]
  return (
    entries.length === 1 &&
    only !== undefined &&
    only[0] === 'isActive' &&
    only[1] === false
  )
}

function isActivateOnlyUpdate(data: UpdateVentasAgentPayload): boolean {
  const entries = Object.entries(data).filter(([, v]) => v !== undefined)
  const only = entries[0]
  return (
    entries.length === 1 &&
    only !== undefined &&
    only[0] === 'isActive' &&
    only[1] === true
  )
}

export const ventasAgentKeys = {
  root: ['ventas-agents'] as const,
  lists: () => [...ventasAgentKeys.root, 'list'] as const,
  list: (params: ListVentasAgentsParams) => [...ventasAgentKeys.lists(), params] as const,
  detail: (id: string) => [...ventasAgentKeys.root, 'detail', id] as const,
}

export function useVentasAgentsList(params: Ref<ListVentasAgentsParams>) {
  return useQuery({
    queryKey: computed(() => ventasAgentKeys.list(unref(params))),
    queryFn: () => ventasAgentsService.list(unref(params)),
  })
}

export function useVentasAgent(id: Ref<string> | string) {
  return useQuery({
    queryKey: computed(() => ventasAgentKeys.detail(typeof id === 'string' ? id : unref(id))),
    queryFn: () => ventasAgentsService.getById(typeof id === 'string' ? id : unref(id)),
    enabled: computed(() => !!unref(id)),
  })
}

export function useVentasCreateAgent() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (payload: CreateVentasAgentPayload) => ventasAgentsService.create(payload),
    onSuccess: () => {
      invalidateQuerySubtree(queryClient, ventasAgentKeys.root)
      void markapAlert.toast.success(
        'Agente registrado',
        'Quedó asociado al módulo de ventas y ya aparece en el listado.',
      )
    },
    onError: (err) => {
      void markapAlert.toast.error(
        'No se pudo registrar el agente',
        getApiErrorMessage(err),
      )
    },
  })
  return {
    ...mutation,
    invalidateList: () =>
      refetchQuerySubtree(queryClient, ventasAgentKeys.root),
  }
}

export function useVentasUpdateAgent() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateVentasAgentPayload }) =>
      ventasAgentsService.update(id, data),
    onSuccess: (_, { data }) => {
      invalidateQuerySubtree(queryClient, ventasAgentKeys.root)
      if (isDeactivateOnlyUpdate(data)) {
        void markapAlert.toast.success(
          'Agente desactivado',
          'Ya no se mostrará como activo en los listados de ventas.',
        )
      } else if (isActivateOnlyUpdate(data)) {
        void markapAlert.toast.success(
          'Agente reactivado',
          'Volverá a mostrarse como activo en los listados.',
        )
      } else {
        void markapAlert.toast.success(
          'Cambios guardados',
          'Los datos del agente se actualizaron correctamente.',
        )
      }
    },
    onError: (err) => {
      void markapAlert.toast.error(
        'No se pudieron guardar los cambios',
        getApiErrorMessage(err),
      )
    },
  })
  return {
    ...mutation,
    invalidateList: () =>
      refetchQuerySubtree(queryClient, ventasAgentKeys.root),
  }
}

export function useVentasDeleteAgent() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (id: string) => ventasAgentsService.delete(id),
    onSuccess: () => {
      invalidateQuerySubtree(queryClient, ventasAgentKeys.root)
      void markapAlert.toast.success(
        'Agente eliminado',
        'Se aplicó borrado lógico: dejará de mostrarse en el listado.',
      )
    },
    onError: (err) => {
      void markapAlert.toast.error(
        'No se pudo eliminar el agente',
        getApiErrorMessage(err),
      )
    },
  })
  return {
    ...mutation,
    invalidateList: () =>
      refetchQuerySubtree(queryClient, ventasAgentKeys.root),
  }
}
