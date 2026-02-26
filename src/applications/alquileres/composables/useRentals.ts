import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, unref, type Ref } from 'vue'
import {
  rentalsService,
  type CreateRentalPayload,
  type ListRentalsParams,
  type UpdateRentalPayload,
  type UpsertRentalFinancialConfigPayload,
} from '../services/rentals.service'

export const rentalKeys = {
  all: ['rentals'] as const,
  list: (params: ListRentalsParams) =>
    [...rentalKeys.all, 'list', params?.applicationSlug ?? '', params?.page ?? 1, params?.limit ?? 10, params?.search ?? '', params?.status ?? ''] as const,
  stats: (slug?: string) => [...rentalKeys.all, 'stats', slug ?? 'alquileres'] as const,
  detail: (id: string) => [...rentalKeys.all, 'detail', id] as const,
  financialConfig: (id: string) => [...rentalKeys.all, 'financial-config', id] as const,
  financialBreakdown: (id: string) => [...rentalKeys.all, 'financial-breakdown', id] as const,
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

export function useRental(id: Ref<string> | string) {
  return useQuery({
    queryKey: computed(() => rentalKeys.detail(unref(id))),
    queryFn: () => rentalsService.getById(unref(id)),
    enabled: computed(() => !!unref(id)),
  })
}

export function useCreateRental() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (params: {
      data: CreateRentalPayload
      files?: { contractFile?: File; deliveryActFile?: File }
    }) => rentalsService.create(params.data, params.files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rentalKeys.all })
    },
  })
  return {
    ...mutation,
    /** Refresca el listado y espera a que termine (para usar antes de navegar). */
    invalidateList: () => queryClient.refetchQueries({ queryKey: rentalKeys.all }),
  }
}

export function useUpdateRental() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRentalPayload }) =>
      rentalsService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: rentalKeys.all })
      queryClient.invalidateQueries({ queryKey: rentalKeys.detail(id) })
    },
  })
  return {
    ...mutation,
    /** Refresca el listado y espera a que termine (para usar antes de navegar). */
    invalidateList: () => queryClient.refetchQueries({ queryKey: rentalKeys.all }),
  }
}

export function useRentalFinancialConfig(id: Ref<string> | string) {
  return useQuery({
    queryKey: computed(() => rentalKeys.financialConfig(unref(id))),
    queryFn: () => rentalsService.getFinancialConfig(unref(id)),
    enabled: computed(() => !!unref(id)),
  })
}

export function useRentalFinancialBreakdown(id: Ref<string> | string) {
  return useQuery({
    queryKey: computed(() => rentalKeys.financialBreakdown(unref(id))),
    queryFn: () => rentalsService.getFinancialBreakdown(unref(id)),
    enabled: computed(() => !!unref(id)),
  })
}

export function useUpsertRentalFinancialConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ rentalId, data }: { rentalId: string; data: UpsertRentalFinancialConfigPayload }) =>
      rentalsService.upsertFinancialConfig(rentalId, data),
    onSuccess: (_, { rentalId }) => {
      queryClient.invalidateQueries({ queryKey: rentalKeys.financialConfig(rentalId) })
      queryClient.invalidateQueries({ queryKey: rentalKeys.financialBreakdown(rentalId) })
    },
  })
}
