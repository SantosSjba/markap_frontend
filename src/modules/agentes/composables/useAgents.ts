import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, unref, type Ref } from 'vue'
import {
  agentsService,
  type ListAgentsParams,
  type CreateAgentPayload,
  type UpdateAgentPayload,
} from '../services/agents.service'

const agentKeys = {
  all: ['agents'] as const,
  lists: () => [...agentKeys.all, 'list'] as const,
  list: (params: ListAgentsParams) => [...agentKeys.lists(), params] as const,
  detail: (id: string) => [...agentKeys.all, 'detail', id] as const,
}

export function useAgentsList(params: Ref<ListAgentsParams>) {
  return useQuery({
    queryKey: computed(() => agentKeys.list(unref(params))),
    queryFn: () => agentsService.list(unref(params)),
  })
}

export function useAgent(id: Ref<string> | string) {
  return useQuery({
    queryKey: computed(() => agentKeys.detail(typeof id === 'string' ? id : unref(id))),
    queryFn: () => agentsService.getById(typeof id === 'string' ? id : unref(id)),
    enabled: computed(() => !!unref(id)),
  })
}

export function useCreateAgent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateAgentPayload) => agentsService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentKeys.lists() })
    },
  })
}

export function useUpdateAgent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAgentPayload }) =>
      agentsService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: agentKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: agentKeys.lists() })
    },
  })
}
