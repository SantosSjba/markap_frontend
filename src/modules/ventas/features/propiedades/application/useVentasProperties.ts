import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, unref, type Ref } from 'vue'
import { markapAlert } from '@/shared/composables'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import { invalidateQuerySubtree, refetchQuerySubtree } from '@/shared/utils/invalidateQuerySubtree'
import type {
  VentasCreatePropertyPayload,
  VentasListPropertiesParams,
  VentasUpdatePropertyPayload,
} from '../domain/property.types'
import { ventasPropertiesApiRepository as ventasPropertiesRepository } from '../infrastructure/repositories/ventas-properties.api.repository'

/** Query keys solo para inventario Ventas — no comparten caché con Alquileres. */
export const ventasPropertyKeys = {
  root: ['ventas-properties'] as const,
  detail: (id: string) => [...ventasPropertyKeys.root, 'detail', id] as const,
  list: (params: VentasListPropertiesParams) =>
    [
      ...ventasPropertyKeys.root,
      'list',
      params?.page ?? 1,
      params?.limit ?? 10,
      params?.search ?? '',
      params?.propertyTypeId ?? '',
      params?.districtId ?? '',
      params?.listingStatus ?? '',
      params?.minSalePrice ?? '',
      params?.maxSalePrice ?? '',
    ] as const,
  propertyTypes: () => [...ventasPropertyKeys.root, 'property-types'] as const,
  departments: () => [...ventasPropertyKeys.root, 'departments'] as const,
  provinces: (departmentId?: string) =>
    [...ventasPropertyKeys.root, 'provinces', departmentId ?? 'all'] as const,
  districts: (provinceId?: string) =>
    [...ventasPropertyKeys.root, 'districts', provinceId ?? 'all'] as const,
  owners: (search?: string) => [...ventasPropertyKeys.root, 'owners', search ?? ''] as const,
  stats: () => [...ventasPropertyKeys.root, 'stats'] as const,
}

export function useVentasPropertyTypes() {
  return useQuery({
    queryKey: ventasPropertyKeys.propertyTypes(),
    queryFn: () => ventasPropertiesRepository.getPropertyTypes(),
  })
}

export function useVentasPropertyDepartments() {
  return useQuery({
    queryKey: ventasPropertyKeys.departments(),
    queryFn: () => ventasPropertiesRepository.getDepartments(),
    staleTime: Infinity,
  })
}

export function useVentasPropertyProvinces(departmentId: Ref<string | undefined> | undefined) {
  return useQuery({
    queryKey: computed(() => ventasPropertyKeys.provinces(unref(departmentId))),
    queryFn: () => ventasPropertiesRepository.getProvinces(unref(departmentId)),
    enabled: computed(() => !!unref(departmentId)),
  })
}

export function useVentasPropertyDistricts(provinceId?: Ref<string | undefined> | string) {
  return useQuery({
    queryKey: computed(() => ventasPropertyKeys.districts(unref(provinceId))),
    queryFn: () => ventasPropertiesRepository.getDistricts(unref(provinceId)),
    enabled: computed(() => !!unref(provinceId)),
  })
}

export function useVentasPropertyOwners(search?: string) {
  return useQuery({
    queryKey: ventasPropertyKeys.owners(search),
    queryFn: () => ventasPropertiesRepository.getOwners(search),
  })
}

export function useVentasPropertiesList(
  params: Ref<VentasListPropertiesParams> | VentasListPropertiesParams,
) {
  const resolved = computed(() =>
    typeof params === 'object' && 'value' in params ? params.value : params,
  )
  return useQuery({
    queryKey: computed(() => ventasPropertyKeys.list(resolved.value)),
    queryFn: () => ventasPropertiesRepository.getList(resolved.value),
  })
}

export function useVentasPropertyStats() {
  return useQuery({
    queryKey: ventasPropertyKeys.stats(),
    queryFn: () => ventasPropertiesRepository.getStats(),
  })
}

export function useVentasPropertyById(id: Ref<string> | string) {
  return useQuery({
    queryKey: computed(() => ventasPropertyKeys.detail(unref(id))),
    queryFn: () => ventasPropertiesRepository.getById(unref(id)),
    enabled: computed(() => !!unref(id)),
  })
}

export function useVentasCreateProperty() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (data: VentasCreatePropertyPayload) => ventasPropertiesRepository.create(data),
    onSuccess: () => {
      invalidateQuerySubtree(queryClient, ventasPropertyKeys.root)
      void markapAlert.toast.success('Propiedad registrada')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo registrar', getApiErrorMessage(err))
    },
  })
  return {
    ...mutation,
    invalidateList: () => refetchQuerySubtree(queryClient, ventasPropertyKeys.root),
  }
}

export function useVentasUpdateProperty() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: VentasUpdatePropertyPayload }) =>
      ventasPropertiesRepository.update(id, data),
    onSuccess: () => {
      invalidateQuerySubtree(queryClient, ventasPropertyKeys.root)
      void markapAlert.toast.success('Propiedad actualizada')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo guardar', getApiErrorMessage(err))
    },
  })
  return {
    ...mutation,
    invalidateList: () => refetchQuerySubtree(queryClient, ventasPropertyKeys.root),
  }
}

export function useVentasUpdatePropertyListingStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      listingStatus,
    }: {
      id: string
      listingStatus: 'AVAILABLE' | 'RESERVED' | 'SOLD'
    }) => ventasPropertiesRepository.updateListingStatus(id, listingStatus),
    onSuccess: () => {
      invalidateQuerySubtree(queryClient, ventasPropertyKeys.root)
      void markapAlert.toast.success('Estado comercial actualizado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo actualizar el estado', getApiErrorMessage(err))
    },
  })
}

export function useVentasDeleteProperty() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => ventasPropertiesRepository.delete(id),
    onSuccess: () => {
      invalidateQuerySubtree(queryClient, ventasPropertyKeys.root)
      void markapAlert.toast.success('Propiedad eliminada')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo eliminar', getApiErrorMessage(err))
    },
  })
}
