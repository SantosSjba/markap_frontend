import { clientsRepositoryKey } from '../../application/ports/clients.port'
import { useService } from '@shared/presentation/di/services'
import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, unref, type Ref } from 'vue'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import {
  invalidateAlquileresQueries,
  refetchAlquileresQueries,
} from '../../../../presentation/queries/invalidateAlquileresQueries'
import {
  alquileresCatalogKeys,
  alquileresQueryKeys,
} from '../../../../application/alquileresQueryKeys'
import { sk } from '@shared/domain/stable-query-key'
import type {
  CreateClientPayload,
  ListClientsParams,
  UpdateClientPayload,
} from '../../domain/client.types'
export const clientKeys = {
  all: alquileresQueryKeys.clients,
  list: (params: ListClientsParams) =>
    [
      ...clientKeys.all,
      'list',
      sk(params.applicationSlug ?? 'alquileres'),
      sk(params.page ?? 1),
      sk(params.limit ?? 10),
      sk(params.search ?? ''),
      sk(params.clientType ?? ''),
      sk(params.salesStatus ?? ''),
      sk(params.isActive ?? ''),
    ] as const,
  detail: (id: string) => [...clientKeys.all, 'detail', id] as const,
  stats: (slug?: string) => [...clientKeys.all, 'stats', slug ?? 'alquileres'] as const,
  documentTypes: () => alquileresCatalogKeys.documentTypes,
  departments: () => alquileresCatalogKeys.departments,
  provinces: (departmentId?: string) => alquileresCatalogKeys.provinces(departmentId),
  districts: (provinceId?: string) => alquileresCatalogKeys.districts(provinceId),
}

export function useClientsList(params: Ref<ListClientsParams>) {
  const clientsRepository = useService(clientsRepositoryKey)
  return useQuery({
    queryKey: computed(() => clientKeys.list(params.value)),
    queryFn: () => clientsRepository.getList(params.value),
    placeholderData: keepPreviousData,
  })
}

export function useClientStats(applicationSlug = 'alquileres') {
  const clientsRepository = useService(clientsRepositoryKey)
  return useQuery({
    queryKey: clientKeys.stats(applicationSlug),
    queryFn: () => clientsRepository.getStats(applicationSlug),
  })
}

export function useDocumentTypes() {
  const clientsRepository = useService(clientsRepositoryKey)
  return useQuery({
    queryKey: clientKeys.documentTypes(),
    queryFn: () => clientsRepository.getDocumentTypes(),
  })
}

export function useDepartments() {
  const clientsRepository = useService(clientsRepositoryKey)
  return useQuery({
    queryKey: clientKeys.departments(),
    queryFn: () => clientsRepository.getDepartments(),
    staleTime: Infinity,
  })
}

export function useProvinces(departmentId: Ref<string | undefined> | undefined) {
  const clientsRepository = useService(clientsRepositoryKey)
  return useQuery({
    queryKey: computed(() => clientKeys.provinces(unref(departmentId))),
    queryFn: () => clientsRepository.getProvinces(unref(departmentId)),
    enabled: computed(() => !!unref(departmentId)),
  })
}

export function useDistricts(provinceId?: Ref<string | undefined> | string) {
  const clientsRepository = useService(clientsRepositoryKey)
  return useQuery({
    queryKey: computed(() => clientKeys.districts(unref(provinceId))),
    queryFn: () => clientsRepository.getDistricts(unref(provinceId)),
    enabled: computed(() => !!unref(provinceId)),
  })
}

export function useClient(id: Ref<string> | string) {
  const clientsRepository = useService(clientsRepositoryKey)
  return useQuery({
    queryKey: computed(() => clientKeys.detail(unref(id))),
    queryFn: () => clientsRepository.getById(unref(id)),
    enabled: computed(() => !!unref(id)),
  })
}

export function useCreateClient() {
  const clientsRepository = useService(clientsRepositoryKey)
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (data: CreateClientPayload) => clientsRepository.create(data),
    onSuccess: () => {
      void invalidateAlquileresQueries(queryClient, 'clients')
      void markapAlert.toast.success('Cliente registrado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo registrar', getApiErrorMessage(err))
    },
  })
  return {
    ...mutation,
    invalidateList: () => refetchAlquileresQueries(queryClient, 'clients'),
  }
}

export function useUpdateClient() {
  const clientsRepository = useService(clientsRepositoryKey)
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClientPayload }) =>
      clientsRepository.update(id, data),
    onSuccess: () => {
      void invalidateAlquileresQueries(queryClient, 'clients')
      void markapAlert.toast.success('Cliente actualizado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo guardar', getApiErrorMessage(err))
    },
  })
  return {
    ...mutation,
    invalidateList: () => refetchAlquileresQueries(queryClient, 'clients'),
  }
}

export function useDeleteClient() {
  const clientsRepository = useService(clientsRepositoryKey)
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => clientsRepository.delete(id),
    onSuccess: () => {
      void invalidateAlquileresQueries(queryClient, 'clients')
      void markapAlert.toast.success('Cliente eliminado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo eliminar', getApiErrorMessage(err))
    },
  })
}
