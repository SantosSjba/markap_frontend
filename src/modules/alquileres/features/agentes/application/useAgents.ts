import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, unref, type Ref } from 'vue'
import { markapAlert } from '@/shared/composables'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import { invalidateQuerySubtree, refetchQuerySubtree } from '@/shared/utils/invalidateQuerySubtree'
import type { CreateAgentPayload, ListAgentsParams, UpdateAgentPayload } from '../domain/agent.types'
import { agentsApiRepository as agentsRepository } from '../infrastructure/repositories/agents.api.repository'

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

/** Incluye el slug en la raíz para que `invalidateQueries` no afecte a ventas (`['agents','ventas']`). */
const agentKeys = {
  all: ['agents', 'alquileres'] as const,
  lists: () => [...agentKeys.all, 'list'] as const,
  list: (params: ListAgentsParams) => [...agentKeys.lists(), params] as const,
  detail: (id: string) => [...agentKeys.all, 'detail', id] as const,
}

export function useAgentsList(params: Ref<ListAgentsParams>) {
  return useQuery({
    queryKey: computed(() => agentKeys.list(unref(params))),
    queryFn: () => agentsRepository.list(unref(params)),
  })
}

export function useAgent(id: Ref<string> | string) {
  return useQuery({
    queryKey: computed(() => agentKeys.detail(typeof id === 'string' ? id : unref(id))),
    queryFn: () => agentsRepository.getById(typeof id === 'string' ? id : unref(id)),
    enabled: computed(() => !!unref(id)),
  })
}

export function useCreateAgent() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (payload: CreateAgentPayload) => agentsRepository.create(payload),
    onSuccess: () => {
      invalidateQuerySubtree(queryClient, agentKeys.all)
      void markapAlert.toast.success(
        'Agente registrado',
        'Quedó asociado al módulo de alquileres y ya aparece en el listado.',
      )
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo registrar el agente', getApiErrorMessage(err))
    },
  })
  return {
    ...mutation,
    invalidateList: () => refetchQuerySubtree(queryClient, agentKeys.all),
  }
}

export function useUpdateAgent() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAgentPayload }) =>
      agentsRepository.update(id, data),
    onSuccess: (_, { data }) => {
      invalidateQuerySubtree(queryClient, agentKeys.all)
      if (isDeactivateOnlyUpdate(data)) {
        void markapAlert.toast.success(
          'Agente desactivado',
          'Ya no se mostrará como activo en los listados de alquileres.',
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
      void markapAlert.toast.error('No se pudieron guardar los cambios', getApiErrorMessage(err))
    },
  })
  return {
    ...mutation,
    invalidateList: () => refetchQuerySubtree(queryClient, agentKeys.all),
  }
}

export function useDeleteAgent() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (id: string) => agentsRepository.delete(id),
    onSuccess: () => {
      invalidateQuerySubtree(queryClient, agentKeys.all)
      void markapAlert.toast.success(
        'Agente eliminado',
        'Se aplicó borrado lógico: dejará de mostrarse en el listado.',
      )
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo eliminar el agente', getApiErrorMessage(err))
    },
  })
  return {
    ...mutation,
    invalidateList: () => refetchQuerySubtree(queryClient, agentKeys.all),
  }
}
