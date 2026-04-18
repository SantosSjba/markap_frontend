import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, unref, type Ref } from 'vue'
import { markapAlert } from '@/shared/alert'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import {
  ventasAgentsService,
  type ListAgentsParams,
  type CreateAgentPayload,
  type UpdateAgentPayload,
} from '../services/agents.service'

function isDeactivateOnlyUpdate(data: UpdateAgentPayload): boolean {
  const entries = Object.entries(data).filter(([, v]) => v !== undefined)
  const only = entries[0]
  return (
    entries.length === 1 &&
    only !== undefined &&
    only[0] === 'isActive' &&
    only[1] === false
  )
}

function isActivateOnlyUpdate(data: UpdateAgentPayload): boolean {
  const entries = Object.entries(data).filter(([, v]) => v !== undefined)
  const only = entries[0]
  return (
    entries.length === 1 &&
    only !== undefined &&
    only[0] === 'isActive' &&
    only[1] === true
  )
}

/** Claves separadas de alquileres para no mezclar caché entre aplicaciones */
const ventasAgentKeys = {
  all: ['agents', 'ventas'] as const,
  lists: () => [...ventasAgentKeys.all, 'list'] as const,
  list: (params: ListAgentsParams) => [...ventasAgentKeys.lists(), params] as const,
  detail: (id: string) => [...ventasAgentKeys.all, 'detail', id] as const,
}

export function useVentasAgentsList(params: Ref<ListAgentsParams>) {
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
    mutationFn: (payload: CreateAgentPayload) => ventasAgentsService.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ventasAgentKeys.all })
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
      queryClient.invalidateQueries({ queryKey: ventasAgentKeys.all }),
  }
}

export function useVentasUpdateAgent() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAgentPayload }) =>
      ventasAgentsService.update(id, data),
    onSuccess: (_, { data }) => {
      void queryClient.invalidateQueries({ queryKey: ventasAgentKeys.all })
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
      queryClient.invalidateQueries({ queryKey: ventasAgentKeys.all }),
  }
}

export function useVentasDeleteAgent() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (id: string) => ventasAgentsService.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ventasAgentKeys.all })
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
      queryClient.invalidateQueries({ queryKey: ventasAgentKeys.all }),
  }
}
