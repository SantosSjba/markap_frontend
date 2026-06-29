import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, unref, type Ref } from 'vue'
import { markapAlert } from '@/shared/composables'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import { invalidateQuerySubtree, refetchQuerySubtree } from '@/shared/utils/invalidateQuerySubtree'
import type {
  CreateProduccionClientPayload,
  ListClientsParams,
  UpdateProduccionClientPayload,
} from '../domain/client.types'
import { PRODUCCION_APP_SLUG } from '@modules/produccion/config/app.constants'
import { produccionClientsApiRepository as clientsRepository } from '../infrastructure/repositories/clients.api.repository'

export const produccionClientKeys = {
  all: ['clients', PRODUCCION_APP_SLUG] as const,
  list: (params: ListClientsParams) => [...produccionClientKeys.all, 'list', params] as const,
  detail: (id: string) => [...produccionClientKeys.all, 'detail', id] as const,
  stats: (slug?: string) => [...produccionClientKeys.all, 'stats', slug ?? PRODUCCION_APP_SLUG] as const,
  documentTypes: () => [...produccionClientKeys.all, 'document-types'] as const,
  departments: () => [...produccionClientKeys.all, 'departments'] as const,
  provinces: (departmentId?: string) =>
    [...produccionClientKeys.all, 'provinces', departmentId ?? 'all'] as const,
  districts: (provinceId?: string) =>
    [...produccionClientKeys.all, 'districts', provinceId ?? 'all'] as const,
}

export function useProduccionClientsList(params: Ref<ListClientsParams>) {
  return useQuery({
    queryKey: computed(() => produccionClientKeys.list(params.value)),
    queryFn: () => clientsRepository.getList(params.value),
  })
}

export function useProduccionClientStats(applicationSlug = PRODUCCION_APP_SLUG) {
  return useQuery({
    queryKey: produccionClientKeys.stats(applicationSlug),
    queryFn: () => clientsRepository.getStats(applicationSlug),
  })
}

export function useDocumentTypes() {
  return useQuery({
    queryKey: produccionClientKeys.documentTypes(),
    queryFn: () => clientsRepository.getDocumentTypes(),
  })
}

export function useDepartments() {
  return useQuery({
    queryKey: produccionClientKeys.departments(),
    queryFn: () => clientsRepository.getDepartments(),
    staleTime: Infinity,
  })
}

export function useProvinces(departmentId: Ref<string | undefined> | undefined) {
  return useQuery({
    queryKey: computed(() => produccionClientKeys.provinces(unref(departmentId))),
    queryFn: () => clientsRepository.getProvinces(unref(departmentId)),
    enabled: computed(() => !!unref(departmentId)),
  })
}

export function useDistricts(provinceId?: Ref<string | undefined> | string) {
  return useQuery({
    queryKey: computed(() => produccionClientKeys.districts(unref(provinceId))),
    queryFn: () => clientsRepository.getDistricts(unref(provinceId)),
    enabled: computed(() => !!unref(provinceId)),
  })
}

export function useProduccionClient(id: Ref<string> | string) {
  return useQuery({
    queryKey: computed(() => produccionClientKeys.detail(unref(id))),
    queryFn: () => clientsRepository.getById(unref(id)),
    enabled: computed(() => !!unref(id)),
  })
}

export function useCreateProduccionClient() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (data: CreateProduccionClientPayload) => clientsRepository.create(data),
    onSuccess: () => {
      invalidateQuerySubtree(queryClient, produccionClientKeys.all)
      void markapAlert.toast.success('Cliente registrado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo registrar', getApiErrorMessage(err))
    },
  })
  return {
    ...mutation,
    invalidateList: () => refetchQuerySubtree(queryClient, produccionClientKeys.all),
  }
}

export function useUpdateProduccionClient() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProduccionClientPayload }) =>
      clientsRepository.update(id, data),
    onSuccess: () => {
      invalidateQuerySubtree(queryClient, produccionClientKeys.all)
      void markapAlert.toast.success('Cliente actualizado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo guardar', getApiErrorMessage(err))
    },
  })
  return {
    ...mutation,
    invalidateList: () => refetchQuerySubtree(queryClient, produccionClientKeys.all),
  }
}

export function useDeleteProduccionClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => clientsRepository.delete(id),
    onSuccess: () => {
      invalidateQuerySubtree(queryClient, produccionClientKeys.all)
      void markapAlert.toast.success('Cliente eliminado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo eliminar', getApiErrorMessage(err))
    },
  })
}
