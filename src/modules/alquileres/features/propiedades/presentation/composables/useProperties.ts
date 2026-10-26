import { propertiesRepositoryKey } from '../../application/ports/properties.port'
import { useService } from '@shared/presentation/di/services'
import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, unref, type Ref } from 'vue'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { invalidateQuerySubtree } from '@shared/utils/invalidateQuerySubtree'
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
  CreatePropertyPayload,
  ListPropertiesParams,
  UpdatePropertyPayload,
} from '../../domain/property.types'
export const propertyKeys = {
  all: alquileresQueryKeys.properties,
  detail: (id: string) => [...propertyKeys.all, 'detail', id] as const,
  list: (params: ListPropertiesParams) =>
    [
      ...propertyKeys.all,
      'list',
      sk(params.applicationSlug ?? 'alquileres'),
      sk(params.page ?? 1),
      sk(params.limit ?? 10),
      sk(params.search ?? ''),
      sk(params.propertyTypeId ?? ''),
      sk(params.districtId ?? ''),
      sk(params.listingStatus ?? ''),
      sk(params.minSalePrice ?? ''),
      sk(params.maxSalePrice ?? ''),
    ] as const,
  propertyTypes: () => [...propertyKeys.all, 'property-types'] as const,
  currencies: () => [...propertyKeys.all, 'currencies'] as const,
  departments: () => alquileresCatalogKeys.departments,
  provinces: (departmentId?: string) => alquileresCatalogKeys.provinces(departmentId),
  districts: (provinceId?: string) => alquileresCatalogKeys.districts(provinceId),
  owners: (slug?: string, search?: string) =>
    [...propertyKeys.all, 'owners', sk(slug ?? 'alquileres'), sk(search ?? '')] as const,
  stats: (slug?: string) => [...propertyKeys.all, 'stats', slug ?? 'alquileres'] as const,
}

export function usePropertyTypes() {
  const propertiesRepository = useService(propertiesRepositoryKey)
  return useQuery({
    queryKey: propertyKeys.propertyTypes(),
    queryFn: () => propertiesRepository.getPropertyTypes(),
  })
}

/** Monedas activas del catálogo (alquiler y mantenimiento de la propiedad). */
export function usePropertyCurrencies() {
  const propertiesRepository = useService(propertiesRepositoryKey)
  return useQuery({
    queryKey: propertyKeys.currencies(),
    queryFn: () => propertiesRepository.getCurrencies(),
    staleTime: Infinity,
  })
}

export function usePropertyDepartments() {
  const propertiesRepository = useService(propertiesRepositoryKey)
  return useQuery({
    queryKey: propertyKeys.departments(),
    queryFn: () => propertiesRepository.getDepartments(),
    staleTime: Infinity,
  })
}

export function usePropertyProvinces(departmentId: Ref<string | undefined> | undefined) {
  const propertiesRepository = useService(propertiesRepositoryKey)
  return useQuery({
    queryKey: computed(() => propertyKeys.provinces(unref(departmentId))),
    queryFn: () => propertiesRepository.getProvinces(unref(departmentId)),
    enabled: computed(() => !!unref(departmentId)),
  })
}

export function usePropertyDistricts(provinceId?: Ref<string | undefined> | string) {
  const propertiesRepository = useService(propertiesRepositoryKey)
  return useQuery({
    queryKey: computed(() => propertyKeys.districts(unref(provinceId))),
    queryFn: () => propertiesRepository.getDistricts(unref(provinceId)),
    enabled: computed(() => !!unref(provinceId)),
  })
}

export function usePropertyOwners(applicationSlug = 'alquileres', search?: string) {
  const propertiesRepository = useService(propertiesRepositoryKey)
  return useQuery({
    queryKey: propertyKeys.owners(applicationSlug, search),
    queryFn: () => propertiesRepository.getOwners(applicationSlug, search),
  })
}

export function usePropertiesList(params: Ref<ListPropertiesParams> | ListPropertiesParams) {
  const propertiesRepository = useService(propertiesRepositoryKey)
  const resolved = computed(() =>
    typeof params === 'object' && 'value' in params ? params.value : params,
  )
  return useQuery({
    queryKey: computed(() => propertyKeys.list(resolved.value)),
    queryFn: () => propertiesRepository.getList(resolved.value),
    placeholderData: keepPreviousData,
  })
}

export function usePropertyStats(applicationSlug = 'alquileres') {
  const propertiesRepository = useService(propertiesRepositoryKey)
  return useQuery({
    queryKey: propertyKeys.stats(applicationSlug),
    queryFn: () => propertiesRepository.getStats(applicationSlug),
  })
}

export function usePropertyById(id: Ref<string> | string) {
  const propertiesRepository = useService(propertiesRepositoryKey)
  return useQuery({
    queryKey: computed(() => propertyKeys.detail(unref(id))),
    queryFn: () => propertiesRepository.getById(unref(id)),
    enabled: computed(() => !!unref(id)),
  })
}

export function useCreateProperty() {
  const propertiesRepository = useService(propertiesRepositoryKey)
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (data: CreatePropertyPayload) => propertiesRepository.create(data),
    onSuccess: () => {
      void invalidateAlquileresQueries(queryClient, 'properties')
      void markapAlert.toast.success('Propiedad registrada')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo registrar', getApiErrorMessage(err))
    },
  })
  return {
    ...mutation,
    invalidateList: () => refetchAlquileresQueries(queryClient, 'properties'),
  }
}

export function useUpdateProperty() {
  const propertiesRepository = useService(propertiesRepositoryKey)
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePropertyPayload }) =>
      propertiesRepository.update(id, data),
    onSuccess: () => {
      void invalidateAlquileresQueries(queryClient, 'properties')
      void markapAlert.toast.success('Propiedad actualizada')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo guardar', getApiErrorMessage(err))
    },
  })
  return {
    ...mutation,
    invalidateList: () => refetchAlquileresQueries(queryClient, 'properties'),
  }
}

export function useUpdatePropertyListingStatus() {
  const propertiesRepository = useService(propertiesRepositoryKey)
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      listingStatus,
    }: {
      id: string
      listingStatus: 'RENTED' | 'EXPIRING' | 'MAINTENANCE'
    }) => propertiesRepository.updateListingStatus(id, listingStatus),
    onSuccess: () => {
      void invalidateAlquileresQueries(queryClient, 'properties')
      void markapAlert.toast.success('Estado de publicación actualizado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo actualizar el estado', getApiErrorMessage(err))
    },
  })
}

export function useDeleteProperty() {
  const propertiesRepository = useService(propertiesRepositoryKey)
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => propertiesRepository.delete(id),
    onSuccess: () => {
      void invalidateAlquileresQueries(queryClient, 'properties')
      void markapAlert.toast.success('Propiedad eliminada')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo eliminar', getApiErrorMessage(err))
    },
  })
}

export function useUploadPropertyMedia() {
  const propertiesRepository = useService(propertiesRepositoryKey)
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, file, kind }: { id: string; file: File; kind: 'photo' | 'plan' }) =>
      propertiesRepository.uploadMedia(id, file, kind),
    onSuccess: (_data, vars) => {
      void invalidateAlquileresQueries(queryClient, 'properties')
      invalidateQuerySubtree(queryClient, propertyKeys.detail(vars.id))
      void markapAlert.toast.success('Archivo multimedia subido')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo subir el archivo', getApiErrorMessage(err))
    },
  })
}
