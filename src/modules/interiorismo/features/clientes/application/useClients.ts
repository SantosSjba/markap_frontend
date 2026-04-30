import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, unref, type Ref } from 'vue'
import { markapAlert } from '@/shared/composables'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import { invalidateQuerySubtree, refetchQuerySubtree } from '@/shared/utils/invalidateQuerySubtree'
import type {
  CreateInteriorClientPayload,
  ListClientsParams,
  UpdateInteriorClientPayload,
} from '../domain/client.types'
import { INTERIORISMO_APP_SLUG } from '@modules/interiorismo/config/app.constants'
import { interiorClientsApiRepository as clientsRepository } from '../infrastructure/repositories/clients.api.repository'

export const interiorClientKeys = {
  all: ['clients', INTERIORISMO_APP_SLUG] as const,
  list: (params: ListClientsParams) => [...interiorClientKeys.all, 'list', params] as const,
  detail: (id: string) => [...interiorClientKeys.all, 'detail', id] as const,
  stats: (slug?: string) => [...interiorClientKeys.all, 'stats', slug ?? INTERIORISMO_APP_SLUG] as const,
  documentTypes: () => [...interiorClientKeys.all, 'document-types'] as const,
  departments: () => [...interiorClientKeys.all, 'departments'] as const,
  provinces: (departmentId?: string) =>
    [...interiorClientKeys.all, 'provinces', departmentId ?? 'all'] as const,
  districts: (provinceId?: string) =>
    [...interiorClientKeys.all, 'districts', provinceId ?? 'all'] as const,
}

export function useInteriorClientsList(params: Ref<ListClientsParams>) {
  return useQuery({
    queryKey: computed(() => interiorClientKeys.list(params.value)),
    queryFn: () => clientsRepository.getList(params.value),
  })
}

export function useInteriorClientStats(applicationSlug = INTERIORISMO_APP_SLUG) {
  return useQuery({
    queryKey: interiorClientKeys.stats(applicationSlug),
    queryFn: () => clientsRepository.getStats(applicationSlug),
  })
}

export function useDocumentTypes() {
  return useQuery({
    queryKey: interiorClientKeys.documentTypes(),
    queryFn: () => clientsRepository.getDocumentTypes(),
  })
}

export function useDepartments() {
  return useQuery({
    queryKey: interiorClientKeys.departments(),
    queryFn: () => clientsRepository.getDepartments(),
    staleTime: Infinity,
  })
}

export function useProvinces(departmentId: Ref<string | undefined> | undefined) {
  return useQuery({
    queryKey: computed(() => interiorClientKeys.provinces(unref(departmentId))),
    queryFn: () => clientsRepository.getProvinces(unref(departmentId)),
    enabled: computed(() => !!unref(departmentId)),
  })
}

export function useDistricts(provinceId?: Ref<string | undefined> | string) {
  return useQuery({
    queryKey: computed(() => interiorClientKeys.districts(unref(provinceId))),
    queryFn: () => clientsRepository.getDistricts(unref(provinceId)),
    enabled: computed(() => !!unref(provinceId)),
  })
}

export function useInteriorClient(id: Ref<string> | string) {
  return useQuery({
    queryKey: computed(() => interiorClientKeys.detail(unref(id))),
    queryFn: () => clientsRepository.getById(unref(id)),
    enabled: computed(() => !!unref(id)),
  })
}

export function useCreateInteriorClient() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (data: CreateInteriorClientPayload) => clientsRepository.create(data),
    onSuccess: () => {
      invalidateQuerySubtree(queryClient, interiorClientKeys.all)
      void markapAlert.toast.success('Cliente registrado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo registrar', getApiErrorMessage(err))
    },
  })
  return {
    ...mutation,
    invalidateList: () => refetchQuerySubtree(queryClient, interiorClientKeys.all),
  }
}

export function useUpdateInteriorClient() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInteriorClientPayload }) =>
      clientsRepository.update(id, data),
    onSuccess: () => {
      invalidateQuerySubtree(queryClient, interiorClientKeys.all)
      void markapAlert.toast.success('Cliente actualizado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo guardar', getApiErrorMessage(err))
    },
  })
  return {
    ...mutation,
    invalidateList: () => refetchQuerySubtree(queryClient, interiorClientKeys.all),
  }
}

export function useDeleteInteriorClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => clientsRepository.delete(id),
    onSuccess: () => {
      invalidateQuerySubtree(queryClient, interiorClientKeys.all)
      void markapAlert.toast.success('Cliente eliminado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo eliminar', getApiErrorMessage(err))
    },
  })
}
