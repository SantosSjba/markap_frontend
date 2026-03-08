import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import {
  paymentsService,
  type ListPendingParams,
  type ListHistoryParams,
  type RegisterPaymentPayload,
} from '../services/payments.service'

export const paymentKeys = {
  all: ['payments'] as const,
  stats: (slug = 'alquileres') => [...paymentKeys.all, 'stats', slug] as const,
  pending: (params: ListPendingParams) => [...paymentKeys.all, 'pending', params] as const,
  history: (params: ListHistoryParams) => [...paymentKeys.all, 'history', params] as const,
  overdue: (slug = 'alquileres', search?: string) =>
    [...paymentKeys.all, 'overdue', slug, search ?? ''] as const,
}

export function usePaymentStats(applicationSlug = 'alquileres') {
  return useQuery({
    queryKey: paymentKeys.stats(applicationSlug),
    queryFn: () => paymentsService.getStats(applicationSlug),
  })
}

export function usePendingPayments(params: Ref<ListPendingParams>) {
  return useQuery({
    queryKey: computed(() => paymentKeys.pending(params.value)),
    queryFn: () => paymentsService.listPending(params.value),
  })
}

export function usePaymentHistory(params: Ref<ListHistoryParams>) {
  return useQuery({
    queryKey: computed(() => paymentKeys.history(params.value)),
    queryFn: () => paymentsService.listHistory(params.value),
  })
}

export function useOverduePayments(applicationSlug = 'alquileres', search?: Ref<string>) {
  return useQuery({
    queryKey: computed(() => paymentKeys.overdue(applicationSlug, search?.value)),
    queryFn: () => paymentsService.listOverdue(applicationSlug, search?.value),
  })
}

export function useRegisterPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ paymentId, data }: { paymentId: string; data: RegisterPaymentPayload }) =>
      paymentsService.registerPayment(paymentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.all })
    },
  })
}
