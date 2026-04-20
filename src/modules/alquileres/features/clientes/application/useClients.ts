import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, unref, type Ref } from 'vue'
import { markapAlert } from '@/shared/alert'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import { invalidateQuerySubtree, refetchQuerySubtree } from '@/shared/utils/invalidateQuerySubtree'
import type { CreateClientPayload, ListClientsParams, UpdateClientPayload } from '../domain/client.types'
import { clientsService } from '../infrastructure/clients.service'

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

export function useDepartments() {
  return useQuery({
    queryKey: clientKeys.departments(),
    queryFn: () => clientsService.getDepartments(),
    staleTime: Infinity,
  })
}

export function useProvinces(departmentId: Ref<string | undefined> | undefined) {
  return useQuery({
    queryKey: computed(() => clientKeys.provinces(unref(departmentId))),
    queryFn: () => clientsService.getProvinces(unref(departmentId)),
    enabled: computed(() => !!unref(departmentId)),
  })
}

export function useDistricts(provinceId?: Ref<string | undefined> | string) {
  return useQuery({
    queryKey: computed(() => clientKeys.districts(unref(provinceId))),
    queryFn: () => clientsService.getDistricts(unref(provinceId)),
    enabled: computed(() => !!unref(provinceId)),
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
  const mutation = useMutation({
    mutationFn: (data: CreateClientPayload) => clientsService.create(data),
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
      clientsService.update(id, data),
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
    mutationFn: (id: string) => clientsService.delete(id),
    onSuccess: () => {
      invalidateQuerySubtree(queryClient, clientKeys.all)
      void markapAlert.toast.success('Cliente eliminado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo eliminar', getApiErrorMessage(err))
    },
  })
}
