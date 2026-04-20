import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, unref, type Ref } from 'vue'
import { markapAlert } from '@/shared/composables'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import { invalidateQuerySubtree, refetchQuerySubtree } from '@/shared/utils/invalidateQuerySubtree'
import type { CreateClientPayload, ListClientsParams, UpdateClientPayload } from '../domain/client.types'
import { clientsApiRepository as clientsRepository } from '../infrastructure/repositories/clients.api.repository'

export const clientKeys = {
  all: ['clients', 'alquileres'] as const,
  list: (params: ListClientsParams) => [...clientKeys.all, 'list', params] as const,
  detail: (id: string) => [...clientKeys.all, 'detail', id] as const,
  stats: (slug?: string) => [...clientKeys.all, 'stats', slug ?? 'alquileres'] as const,
  documentTypes: () => [...clientKeys.all, 'document-types'] as const,
  departments: () => [...clientKeys.all, 'departments'] as const,
  provinces: (departmentId?: string) =>
    [...clientKeys.all, 'provinces', departmentId ?? 'all'] as const,
  districts: (provinceId?: string) =>
    [...clientKeys.all, 'districts', provinceId ?? 'all'] as const,
}

export function useClientsList(params: Ref<ListClientsParams>) {
  return useQuery({
    queryKey: computed(() => clientKeys.list(params.value)),
    queryFn: () => clientsRepository.getList(params.value),
  })
}

export function useClientStats(applicationSlug = 'alquileres') {
  return useQuery({
    queryKey: clientKeys.stats(applicationSlug),
    queryFn: () => clientsRepository.getStats(applicationSlug),
  })
}

export function useDocumentTypes() {
  return useQuery({
    queryKey: clientKeys.documentTypes(),
    queryFn: () => clientsRepository.getDocumentTypes(),
  })
}

export function useDepartments() {
  return useQuery({
    queryKey: clientKeys.departments(),
    queryFn: () => clientsRepository.getDepartments(),
    staleTime: Infinity,
  })
}

export function useProvinces(departmentId: Ref<string | undefined> | undefined) {
  return useQuery({
    queryKey: computed(() => clientKeys.provinces(unref(departmentId))),
    queryFn: () => clientsRepository.getProvinces(unref(departmentId)),
    enabled: computed(() => !!unref(departmentId)),
  })
}

export function useDistricts(provinceId?: Ref<string | undefined> | string) {
  return useQuery({
    queryKey: computed(() => clientKeys.districts(unref(provinceId))),
    queryFn: () => clientsRepository.getDistricts(unref(provinceId)),
    enabled: computed(() => !!unref(provinceId)),
  })
}

export function useClient(id: Ref<string> | string) {
  return useQuery({
    queryKey: computed(() => clientKeys.detail(unref(id))),
    queryFn: () => clientsRepository.getById(unref(id)),
    enabled: computed(() => !!unref(id)),
  })
}

export function useCreateClient() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (data: CreateClientPayload) => clientsRepository.create(data),
    onSuccess: () => {
      invalidateQuerySubtree(queryClient, clientKeys.all)
      void markapAlert.toast.success('Cliente registrado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo registrar', getApiErrorMessage(err))
    },
  })
  return {
    ...mutation,
    invalidateList: () => refetchQuerySubtree(queryClient, clientKeys.all),
  }
}

export function useUpdateClient() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClientPayload }) =>
      clientsRepository.update(id, data),
    onSuccess: () => {
      invalidateQuerySubtree(queryClient, clientKeys.all)
      void markapAlert.toast.success('Cliente actualizado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo guardar', getApiErrorMessage(err))
    },
  })
  return {
    ...mutation,
    invalidateList: () => refetchQuerySubtree(queryClient, clientKeys.all),
  }
}

export function useDeleteClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => clientsRepository.delete(id),
    onSuccess: () => {
      invalidateQuerySubtree(queryClient, clientKeys.all)
      void markapAlert.toast.success('Cliente eliminado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo eliminar', getApiErrorMessage(err))
    },
  })
}
