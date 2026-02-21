import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import {
  propertiesService,
  type CreatePropertyPayload,
  type ListPropertiesParams,
} from '../services/properties.service'

export const propertyKeys = {
  all: ['properties'] as const,
  list: (params: ListPropertiesParams) =>
    [...propertyKeys.all, 'list', params?.applicationSlug ?? 'alquileres', params?.page ?? 1, params?.limit ?? 10, params?.search ?? '', params?.propertyTypeId ?? '', params?.listingStatus ?? ''] as const,
  propertyTypes: () => [...propertyKeys.all, 'property-types'] as const,
  districts: (provinceId?: string) =>
    [...propertyKeys.all, 'districts', provinceId ?? 'all'] as const,
  owners: (slug?: string, search?: string) =>
    [...propertyKeys.all, 'owners', slug ?? 'alquileres', search ?? ''] as const,
  stats: (slug?: string) => [...propertyKeys.all, 'stats', slug ?? 'alquileres'] as const,
}

export function usePropertyTypes() {
  return useQuery({
    queryKey: propertyKeys.propertyTypes(),
    queryFn: () => propertiesService.getPropertyTypes(),
  })
}

export function usePropertyDistricts(provinceId?: string) {
  return useQuery({
    queryKey: propertyKeys.districts(provinceId),
    queryFn: () => propertiesService.getDistricts(provinceId),
  })
}

export function usePropertyOwners(applicationSlug = 'alquileres', search?: string) {
  return useQuery({
    queryKey: propertyKeys.owners(applicationSlug, search),
    queryFn: () => propertiesService.getOwners(applicationSlug, search),
  })
}

export function usePropertiesList(params: Ref<ListPropertiesParams> | ListPropertiesParams) {
  const resolved = computed(() => (typeof params === 'object' && 'value' in params ? params.value : params))
  return useQuery({
    queryKey: computed(() => propertyKeys.list(resolved.value)),
    queryFn: () => propertiesService.getList(resolved.value),
  })
}

export function usePropertyStats(applicationSlug = 'alquileres') {
  return useQuery({
    queryKey: propertyKeys.stats(applicationSlug),
    queryFn: () => propertiesService.getStats(applicationSlug),
  })
}

export function useCreateProperty() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreatePropertyPayload) => propertiesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.all })
    },
  })
}
