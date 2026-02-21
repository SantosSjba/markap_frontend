import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, ref } from 'vue'
import {
  propertiesService,
  type CreatePropertyPayload,
} from '../services/properties.service'

export const propertyKeys = {
  all: ['properties'] as const,
  propertyTypes: () => [...propertyKeys.all, 'property-types'] as const,
  districts: (provinceId?: string) =>
    [...propertyKeys.all, 'districts', provinceId ?? 'all'] as const,
  owners: (slug?: string, search?: string) =>
    [...propertyKeys.all, 'owners', slug ?? 'alquileres', search ?? ''] as const,
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

export function useCreateProperty() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreatePropertyPayload) => propertiesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.all })
    },
  })
}
