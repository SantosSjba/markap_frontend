import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, unref, type Ref } from 'vue'
import {
  clientsService,
  type CreateClientPayload,
  type UpdateClientPayload,
  type ListClientsParams,
} from '../services/clients.service'

export const clientKeys = {
  all: ['clients'] as const,
  list: (params: ListClientsParams) => [...clientKeys.all, 'list', params] as const,
  detail: (id: string) => [...clientKeys.all, 'detail', id] as const,
  stats: (slug?: string) => [...clientKeys.all, 'stats', slug ?? 'alquileres'] as const,
  documentTypes: () => [...clientKeys.all, 'document-types'] as const,
  districts: (provinceId?: string) =>
    [...clientKeys.all, 'districts', provinceId ?? 'all'] as const,
}

export function useClientsList(params: Ref<ListClientsParams>) {
  return useQuery({
    queryKey: computed(() => clientKeys.list(params.value)),
    queryFn: () => clientsService.getList(params.value),
  })
}

export function useClientStats(applicationSlug = 'alquileres') {
  return useQuery({
    queryKey: clientKeys.stats(applicationSlug),
    queryFn: () => clientsService.getStats(applicationSlug),
  })
}

export function useDocumentTypes() {
  return useQuery({
    queryKey: clientKeys.documentTypes(),
    queryFn: () => clientsService.getDocumentTypes(),
  })
}

export function useDistricts(provinceId?: string) {
  return useQuery({
    queryKey: clientKeys.districts(provinceId),
    queryFn: () => clientsService.getDistricts(provinceId),
  })
}

export function useClient(id: Ref<string> | string) {
  return useQuery({
    queryKey: computed(() => clientKeys.detail(unref(id))),
    queryFn: () => clientsService.getById(unref(id)),
    enabled: computed(() => !!unref(id)),
  })
}

export function useCreateClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateClientPayload) => clientsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.all })
    },
  })
}

export function useUpdateClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClientPayload }) =>
      clientsService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: clientKeys.all })
      queryClient.invalidateQueries({ queryKey: clientKeys.detail(id) })
    },
  })
}
