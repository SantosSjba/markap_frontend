import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, unref, type Ref } from 'vue'
import { markapAlert } from '@/shared/alert'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import {
  ventasClientsService,
  VENTAS_CLIENTS_APPLICATION_SLUG,
  type CreateVentasClientPayload,
  type UpdateVentasClientPayload,
  type ListVentasClientsParams,
} from '../services/clients.service'

const ventasClientKeys = {
  all: ['clients', 'ventas'] as const,
  list: (params: ListVentasClientsParams) => [...ventasClientKeys.all, 'list', params] as const,
  detail: (id: string) => [...ventasClientKeys.all, 'detail', id] as const,
  stats: () => [...ventasClientKeys.all, 'stats', VENTAS_CLIENTS_APPLICATION_SLUG] as const,
  documentTypes: () => [...ventasClientKeys.all, 'document-types'] as const,
  departments: () => [...ventasClientKeys.all, 'departments'] as const,
  provinces: (departmentId?: string) =>
    [...ventasClientKeys.all, 'provinces', departmentId ?? 'all'] as const,
  districts: (provinceId?: string) =>
    [...ventasClientKeys.all, 'districts', provinceId ?? 'all'] as const,
}

export function useVentasClientsList(params: Ref<ListVentasClientsParams>) {
  return useQuery({
    queryKey: computed(() => ventasClientKeys.list(params.value)),
    queryFn: () => ventasClientsService.getList(params.value),
  })
}

export function useVentasClientStats() {
  return useQuery({
    queryKey: ventasClientKeys.stats(),
    queryFn: () => ventasClientsService.getStats(),
  })
}

export function useVentasClientDocumentTypes() {
  return useQuery({
    queryKey: ventasClientKeys.documentTypes(),
    queryFn: () => ventasClientsService.getDocumentTypes(),
  })
}

export function useVentasClientDepartments() {
  return useQuery({
    queryKey: ventasClientKeys.departments(),
    queryFn: () => ventasClientsService.getDepartments(),
    staleTime: Infinity,
  })
}

export function useVentasClientProvinces(departmentId: Ref<string | undefined> | undefined) {
  return useQuery({
    queryKey: computed(() => ventasClientKeys.provinces(unref(departmentId))),
    queryFn: () => ventasClientsService.getProvinces(unref(departmentId)),
    enabled: computed(() => !!unref(departmentId)),
  })
}

export function useVentasClientDistricts(provinceId?: Ref<string | undefined> | string) {
  return useQuery({
    queryKey: computed(() => ventasClientKeys.districts(unref(provinceId))),
    queryFn: () => ventasClientsService.getDistricts(unref(provinceId)),
    enabled: computed(() => !!unref(provinceId)),
  })
}

export function useVentasClient(id: Ref<string> | string) {
  return useQuery({
    queryKey: computed(() => ventasClientKeys.detail(unref(id))),
    queryFn: () => ventasClientsService.getById(unref(id)),
    enabled: computed(() => !!unref(id)),
  })
}

export function useVentasCreateClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateVentasClientPayload) => ventasClientsService.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ventasClientKeys.all })
      void markapAlert.toast.success('Cliente registrado', 'Lead guardado en ventas.')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo registrar', getApiErrorMessage(err))
    },
  })
}

export function useVentasUpdateClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateVentasClientPayload }) =>
      ventasClientsService.update(id, data),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ventasClientKeys.all })
      void queryClient.invalidateQueries({ queryKey: ventasClientKeys.detail(id) })
      void markapAlert.toast.success('Cliente actualizado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo guardar', getApiErrorMessage(err))
    },
  })
}

export function useVentasDeleteClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => ventasClientsService.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ventasClientKeys.all })
      void markapAlert.toast.success('Cliente eliminado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo eliminar', getApiErrorMessage(err))
    },
  })
}
