import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import {
  rentalsService,
  type CreateRentalPayload,
  type ListRentalsParams,
} from '../services/rentals.service'

export const rentalKeys = {
  all: ['rentals'] as const,
  list: (params: ListRentalsParams) =>
    [...rentalKeys.all, 'list', params?.applicationSlug ?? '', params?.page ?? 1, params?.limit ?? 10, params?.search ?? '', params?.status ?? ''] as const,
  stats: (slug?: string) => [...rentalKeys.all, 'stats', slug ?? 'alquileres'] as const,
}

export function useRentalsList(params: Ref<ListRentalsParams>) {
  return useQuery({
    queryKey: computed(() => rentalKeys.list(params.value)),
    queryFn: () => rentalsService.getList(params.value),
  })
}

export function useRentalStats(applicationSlug = 'alquileres') {
  return useQuery({
    queryKey: rentalKeys.stats(applicationSlug),
    queryFn: () => rentalsService.getStats(applicationSlug),
  })
}

export function useCreateRental() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: {
      data: CreateRentalPayload
      files?: { contractFile?: File; deliveryActFile?: File }
    }) => rentalsService.create(params.data, params.files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rentalKeys.all })
    },
  })
}
