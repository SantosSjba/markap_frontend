import { arquitecturaClientsRepositoryKey as clientsRepositoryKey } from '../../application/ports/clients.port'
import { useService } from '@shared/presentation/di/services'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, unref, type Ref } from 'vue'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { refetchQuerySubtree } from '@shared/utils/invalidateQuerySubtree'
import { invalidateModuleQueries } from '@shared/utils/invalidateModuleQueries'
import type {
  CreateArquitecturaClientPayload,
  ListClientsParams,
  UpdateArquitecturaClientPayload,
} from '../../domain/client.types'
import { ARQUITECTURA_APP_SLUG } from '../../../../config/app.constants'
export const arquitecturaClientKeys = {
  all: ['clients', ARQUITECTURA_APP_SLUG] as const,
  list: (params: ListClientsParams) => [...arquitecturaClientKeys.all, 'list', params] as const,
  detail: (id: string) => [...arquitecturaClientKeys.all, 'detail', id] as const,
  stats: (slug?: string) =>
    [...arquitecturaClientKeys.all, 'stats', slug ?? ARQUITECTURA_APP_SLUG] as const,
  documentTypes: () => [...arquitecturaClientKeys.all, 'document-types'] as const,
  departments: () => [...arquitecturaClientKeys.all, 'departments'] as const,
  provinces: (departmentId?: string) =>
    [...arquitecturaClientKeys.all, 'provinces', departmentId ?? 'all'] as const,
  districts: (provinceId?: string) =>
    [...arquitecturaClientKeys.all, 'districts', provinceId ?? 'all'] as const,
}

export function useArquitecturaClientsList(params: Ref<ListClientsParams>) {
  const clientsRepository = useService(clientsRepositoryKey)
  return useQuery({
    queryKey: computed(() => arquitecturaClientKeys.list(params.value)),
    queryFn: () => clientsRepository.getList(params.value),
  })
}

export function useArquitecturaClientStats(applicationSlug = ARQUITECTURA_APP_SLUG) {
  const clientsRepository = useService(clientsRepositoryKey)
  return useQuery({
    queryKey: arquitecturaClientKeys.stats(applicationSlug),
    queryFn: () => clientsRepository.getStats(applicationSlug),
  })
}

export function useDocumentTypes() {
  const clientsRepository = useService(clientsRepositoryKey)
  return useQuery({
    queryKey: arquitecturaClientKeys.documentTypes(),
    queryFn: () => clientsRepository.getDocumentTypes(),
  })
}

export function useDepartments() {
  const clientsRepository = useService(clientsRepositoryKey)
  return useQuery({
    queryKey: arquitecturaClientKeys.departments(),
    queryFn: () => clientsRepository.getDepartments(),
    staleTime: Infinity,
  })
}

export function useProvinces(departmentId: Ref<string | undefined> | undefined) {
  const clientsRepository = useService(clientsRepositoryKey)
  return useQuery({
    queryKey: computed(() => arquitecturaClientKeys.provinces(unref(departmentId))),
    queryFn: () => clientsRepository.getProvinces(unref(departmentId)),
    enabled: computed(() => !!unref(departmentId)),
  })
}

export function useDistricts(provinceId?: Ref<string | undefined> | string) {
  const clientsRepository = useService(clientsRepositoryKey)
  return useQuery({
    queryKey: computed(() => arquitecturaClientKeys.districts(unref(provinceId))),
    queryFn: () => clientsRepository.getDistricts(unref(provinceId)),
    enabled: computed(() => !!unref(provinceId)),
  })
}

export function useArquitecturaClient(id: Ref<string> | string) {
  const clientsRepository = useService(clientsRepositoryKey)
  return useQuery({
    queryKey: computed(() => arquitecturaClientKeys.detail(unref(id))),
    queryFn: () => clientsRepository.getById(unref(id)),
    enabled: computed(() => !!unref(id)),
  })
}

export function useCreateArquitecturaClient() {
  const clientsRepository = useService(clientsRepositoryKey)
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (data: CreateArquitecturaClientPayload) => clientsRepository.create(data),
    onSuccess: async () => {
      await invalidateModuleQueries(queryClient, 'arquitectura')
      void markapAlert.toast.success('Cliente registrado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo registrar', getApiErrorMessage(err))
    },
  })
  return {
    ...mutation,
    invalidateList: () => refetchQuerySubtree(queryClient, arquitecturaClientKeys.all),
  }
}

export function useUpdateArquitecturaClient() {
  const clientsRepository = useService(clientsRepositoryKey)
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateArquitecturaClientPayload }) =>
      clientsRepository.update(id, data),
    onSuccess: async () => {
      await invalidateModuleQueries(queryClient, 'arquitectura')
      void markapAlert.toast.success('Cliente actualizado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo guardar', getApiErrorMessage(err))
    },
  })
  return {
    ...mutation,
    invalidateList: () => refetchQuerySubtree(queryClient, arquitecturaClientKeys.all),
  }
}

export function useDeleteArquitecturaClient() {
  const clientsRepository = useService(clientsRepositoryKey)
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => clientsRepository.delete(id),
    onSuccess: async () => {
      await invalidateModuleQueries(queryClient, 'arquitectura')
      void markapAlert.toast.success('Cliente eliminado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo eliminar', getApiErrorMessage(err))
    },
  })
}
