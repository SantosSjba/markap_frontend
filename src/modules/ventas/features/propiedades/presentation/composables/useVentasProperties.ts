import { ventasPropertiesRepositoryKey } from '../../application/ports/ventas-properties.port'
import { useService } from '@shared/presentation/di/services'
import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, unref, type Ref } from 'vue'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { invalidateQuerySubtree, refetchQuerySubtree } from '@shared/utils/invalidateQuerySubtree'
import { invalidateVentasRelatedData } from '../../../../presentation/composables/invalidateVentasRelatedData'
import type {
  VentasCreatePropertyPayload,
  VentasListPropertiesParams,
  VentasUpdatePropertyPayload,
} from '../../domain/property.types'
import {
  UBIGEO_OTHER_DEPARTMENT_ID,
  UBIGEO_OTHER_PROVINCE_ID,
} from '@shared/domain/ubigeo-other'
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
  currencies: () => [...ventasPropertyKeys.root, 'currencies'] as const,
  departments: () => [...ventasPropertyKeys.root, 'departments'] as const,
  provinces: (departmentId?: string) =>
    [...ventasPropertyKeys.root, 'provinces', departmentId ?? 'all'] as const,
  districts: (provinceId?: string) =>
    [...ventasPropertyKeys.root, 'districts', provinceId ?? 'all'] as const,
  owners: (search?: string) => [...ventasPropertyKeys.root, 'owners', search ?? ''] as const,
  stats: () => [...ventasPropertyKeys.root, 'stats'] as const,
}

export function useVentasPropertyTypes() {
  const ventasPropertiesRepository = useService(ventasPropertiesRepositoryKey)
  return useQuery({
    queryKey: ventasPropertyKeys.propertyTypes(),
    queryFn: () => ventasPropertiesRepository.getPropertyTypes(),
  })
}

export function useVentasPropertyCurrencies() {
  const ventasPropertiesRepository = useService(ventasPropertiesRepositoryKey)
  return useQuery({
    queryKey: ventasPropertyKeys.currencies(),
    queryFn: () => ventasPropertiesRepository.getCurrencies(),
    staleTime: Infinity,
  })
}

export function useVentasPropertyDepartments() {
  const ventasPropertiesRepository = useService(ventasPropertiesRepositoryKey)
  return useQuery({
    queryKey: ventasPropertyKeys.departments(),
    queryFn: () => ventasPropertiesRepository.getDepartments(),
    staleTime: Infinity,
  })
}

export function useVentasPropertyProvinces(departmentId: Ref<string | undefined> | undefined) {
  const ventasPropertiesRepository = useService(ventasPropertiesRepositoryKey)
  return useQuery({
    queryKey: computed(() => ventasPropertyKeys.provinces(unref(departmentId))),
    queryFn: () => ventasPropertiesRepository.getProvinces(unref(departmentId)),
    enabled: computed(() => {
      const id = unref(departmentId)
      return !!id && id !== UBIGEO_OTHER_DEPARTMENT_ID
    }),
    placeholderData: keepPreviousData,
  })
}

export function useVentasPropertyDistricts(provinceId?: Ref<string | undefined> | string) {
  const ventasPropertiesRepository = useService(ventasPropertiesRepositoryKey)
  return useQuery({
    queryKey: computed(() => ventasPropertyKeys.districts(unref(provinceId))),
    queryFn: () => ventasPropertiesRepository.getDistricts(unref(provinceId)),
    enabled: computed(() => {
      const id = unref(provinceId)
      return !!id && id !== UBIGEO_OTHER_PROVINCE_ID
    }),
    placeholderData: keepPreviousData,
  })
}

export function useVentasPropertyOwners(search?: string) {
  const ventasPropertiesRepository = useService(ventasPropertiesRepositoryKey)
  return useQuery({
    queryKey: ventasPropertyKeys.owners(search),
    queryFn: () => ventasPropertiesRepository.getOwners(search),
  })
}

export function useVentasPropertiesList(
  params: Ref<VentasListPropertiesParams> | VentasListPropertiesParams,
) {
  const ventasPropertiesRepository = useService(ventasPropertiesRepositoryKey)
  const resolved = computed(() =>
    typeof params === 'object' && 'value' in params ? params.value : params,
  )
  return useQuery({
    queryKey: computed(() => ventasPropertyKeys.list(resolved.value)),
    queryFn: () => ventasPropertiesRepository.getList(resolved.value),
  })
}

export function useVentasPropertyStats() {
  const ventasPropertiesRepository = useService(ventasPropertiesRepositoryKey)
  return useQuery({
    queryKey: ventasPropertyKeys.stats(),
    queryFn: () => ventasPropertiesRepository.getStats(),
  })
}

export function useVentasPropertyById(id: Ref<string> | string) {
  const ventasPropertiesRepository = useService(ventasPropertiesRepositoryKey)
  return useQuery({
    queryKey: computed(() => ventasPropertyKeys.detail(unref(id))),
    queryFn: () => ventasPropertiesRepository.getById(unref(id)),
    enabled: computed(() => !!unref(id)),
  })
}

export function useVentasCreateProperty() {
  const ventasPropertiesRepository = useService(ventasPropertiesRepositoryKey)
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (data: VentasCreatePropertyPayload) => ventasPropertiesRepository.create(data),
    onSuccess: () => {
      invalidateQuerySubtree(queryClient, ventasPropertyKeys.root)
      void invalidateVentasRelatedData(queryClient)
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
  const ventasPropertiesRepository = useService(ventasPropertiesRepositoryKey)
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: VentasUpdatePropertyPayload }) =>
      ventasPropertiesRepository.update(id, data),
    onSuccess: () => {
      invalidateQuerySubtree(queryClient, ventasPropertyKeys.root)
      void invalidateVentasRelatedData(queryClient)
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
  const ventasPropertiesRepository = useService(ventasPropertiesRepositoryKey)
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
      void invalidateVentasRelatedData(queryClient)
      void markapAlert.toast.success('Estado comercial actualizado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo actualizar el estado', getApiErrorMessage(err))
    },
  })
}

export function useVentasDeleteProperty() {
  const ventasPropertiesRepository = useService(ventasPropertiesRepositoryKey)
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => ventasPropertiesRepository.delete(id),
    onSuccess: () => {
      invalidateQuerySubtree(queryClient, ventasPropertyKeys.root)
      void invalidateVentasRelatedData(queryClient)
      void markapAlert.toast.success('Propiedad eliminada')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo eliminar', getApiErrorMessage(err))
    },
  })
}

export function useVentasUploadPropertyMedia() {
  const ventasPropertiesRepository = useService(ventasPropertiesRepositoryKey)
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, file, kind }: { id: string; file: File; kind: 'photo' | 'plan' }) =>
      ventasPropertiesRepository.uploadMedia(id, file, kind),
    onSuccess: (_data, vars) => {
      invalidateQuerySubtree(queryClient, ventasPropertyKeys.root)
      void invalidateVentasRelatedData(queryClient)
      invalidateQuerySubtree(queryClient, ventasPropertyKeys.detail(vars.id))
      void markapAlert.toast.success('Archivo multimedia subido')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo subir el archivo', getApiErrorMessage(err))
    },
  })
}
