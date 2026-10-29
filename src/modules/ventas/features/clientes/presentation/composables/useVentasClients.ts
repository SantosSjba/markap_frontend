import { ventasClientsRepositoryKey } from '../../application/ports/ventas-clients.port'
import { useService } from '@shared/presentation/di/services'
import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, unref, type Ref } from 'vue'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { invalidateQuerySubtree } from '@shared/utils/invalidateQuerySubtree'
import { invalidateVentasRelatedData } from '../../../../presentation/composables/invalidateVentasRelatedData'
import type {
  CreateVentasClientPayload,
  ListVentasClientsParams,
  UpdateVentasClientPayload,
} from '../../domain/client.types'
import {
  UBIGEO_OTHER_DEPARTMENT_ID,
  UBIGEO_OTHER_PROVINCE_ID,
} from '@shared/domain/ubigeo-other'
/** Caché e invalidación CRM clientes Ventas (sin prefijo compartido con Alquileres). */
export const ventasClientKeys = {
  root: ['ventas-clients'] as const,
  list: (params: ListVentasClientsParams) => [...ventasClientKeys.root, 'list', params] as const,
  detail: (id: string) => [...ventasClientKeys.root, 'detail', id] as const,
  stats: () => [...ventasClientKeys.root, 'stats'] as const,
  documentTypes: () => [...ventasClientKeys.root, 'document-types'] as const,
  departments: () => [...ventasClientKeys.root, 'departments'] as const,
  provinces: (departmentId?: string) =>
    [...ventasClientKeys.root, 'provinces', departmentId ?? 'all'] as const,
  districts: (provinceId?: string) =>
    [...ventasClientKeys.root, 'districts', provinceId ?? 'all'] as const,
}

export function useVentasClientsList(params: Ref<ListVentasClientsParams>) {
  const ventasClientsRepository = useService(ventasClientsRepositoryKey)
  return useQuery({
    queryKey: computed(() => ventasClientKeys.list(params.value)),
    queryFn: () => ventasClientsRepository.getList(params.value),
  })
}

export function useVentasClientStats() {
  const ventasClientsRepository = useService(ventasClientsRepositoryKey)
  return useQuery({
    queryKey: ventasClientKeys.stats(),
    queryFn: () => ventasClientsRepository.getStats(),
  })
}

export function useVentasClientDocumentTypes() {
  const ventasClientsRepository = useService(ventasClientsRepositoryKey)
  return useQuery({
    queryKey: ventasClientKeys.documentTypes(),
    queryFn: () => ventasClientsRepository.getDocumentTypes(),
  })
}

export function useVentasClientDepartments() {
  const ventasClientsRepository = useService(ventasClientsRepositoryKey)
  return useQuery({
    queryKey: ventasClientKeys.departments(),
    queryFn: () => ventasClientsRepository.getDepartments(),
    staleTime: Infinity,
  })
}

export function useVentasClientProvinces(departmentId: Ref<string | undefined> | undefined) {
  const ventasClientsRepository = useService(ventasClientsRepositoryKey)
  return useQuery({
    queryKey: computed(() => ventasClientKeys.provinces(unref(departmentId))),
    queryFn: () => ventasClientsRepository.getProvinces(unref(departmentId)),
    enabled: computed(() => {
      const id = unref(departmentId)
      return !!id && id !== UBIGEO_OTHER_DEPARTMENT_ID
    }),
    placeholderData: keepPreviousData,
  })
}

export function useVentasClientDistricts(provinceId?: Ref<string | undefined> | string) {
  const ventasClientsRepository = useService(ventasClientsRepositoryKey)
  return useQuery({
    queryKey: computed(() => ventasClientKeys.districts(unref(provinceId))),
    queryFn: () => ventasClientsRepository.getDistricts(unref(provinceId)),
    enabled: computed(() => {
      const id = unref(provinceId)
      return !!id && id !== UBIGEO_OTHER_PROVINCE_ID
    }),
    placeholderData: keepPreviousData,
  })
}

export function useVentasClient(id: Ref<string> | string) {
  const ventasClientsRepository = useService(ventasClientsRepositoryKey)
  return useQuery({
    queryKey: computed(() => ventasClientKeys.detail(unref(id))),
    queryFn: () => ventasClientsRepository.getById(unref(id)),
    enabled: computed(() => !!unref(id)),
  })
}

export function useVentasCreateClient() {
  const ventasClientsRepository = useService(ventasClientsRepositoryKey)
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateVentasClientPayload) => ventasClientsRepository.create(data),
    onSuccess: () => {
      invalidateQuerySubtree(queryClient, ventasClientKeys.root)
      void invalidateVentasRelatedData(queryClient)
      void markapAlert.toast.success(
        'Cliente registrado',
        'El registro quedó guardado en el módulo Ventas.',
      )
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo registrar', getApiErrorMessage(err))
    },
  })
}

export function useVentasUpdateClient() {
  const ventasClientsRepository = useService(ventasClientsRepositoryKey)
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateVentasClientPayload }) =>
      ventasClientsRepository.update(id, data),
    onSuccess: () => {
      invalidateQuerySubtree(queryClient, ventasClientKeys.root)
      void invalidateVentasRelatedData(queryClient)
      void markapAlert.toast.success('Cliente actualizado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo guardar', getApiErrorMessage(err))
    },
  })
}

export function useVentasDeleteClient() {
  const ventasClientsRepository = useService(ventasClientsRepositoryKey)
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => ventasClientsRepository.delete(id),
    onSuccess: () => {
      invalidateQuerySubtree(queryClient, ventasClientKeys.root)
      void invalidateVentasRelatedData(queryClient)
      void markapAlert.toast.success('Cliente eliminado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo eliminar', getApiErrorMessage(err))
    },
  })
}
