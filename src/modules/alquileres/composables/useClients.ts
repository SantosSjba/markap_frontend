import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { clientsService, type CreateClientPayload } from '../services/clients.service'

export const clientKeys = {
  all: ['clients'] as const,
  documentTypes: () => [...clientKeys.all, 'document-types'] as const,
  districts: (provinceId?: string) =>
    [...clientKeys.all, 'districts', provinceId ?? 'all'] as const,
}

export function useDocumentTypes() {
  return useQuery({
    queryKey: clientKeys.documentTypes(),
    queryFn: () => clientsService.getDocumentTypes(),
  })
}

export function useDistricts(provinceId?: string) {
  return useQuery({
    queryKey: clientKeys.districts(provinceId),
    queryFn: () => clientsService.getDistricts(provinceId),
  })
}

export function useCreateClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateClientPayload) => clientsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.all })
    },
  })
}
