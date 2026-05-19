import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { markapAlert } from '@/shared/composables'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import { invalidateAlquileresQueries } from '@modules/alquileres/application'
import { alquileresQueryKeys } from '@modules/alquileres/application/alquileresQueryKeys'
import { sk } from '@modules/alquileres/application/stableQueryKey'
import type { ListHistoryParams, ListPendingParams, RegisterPaymentPayload } from '../domain/payment.types'
import { paymentsApiRepository as paymentsRepository } from '../infrastructure/repositories/payments.api.repository'

export const paymentKeys = {
  all: alquileresQueryKeys.payments,
  stats: (slug = 'alquileres') => [...paymentKeys.all, 'stats', slug] as const,
  pending: (params: ListPendingParams) =>
    [
      ...paymentKeys.all,
      'pending',
      sk(params.applicationSlug ?? 'alquileres'),
      sk(params.search ?? ''),
      sk(params.status ?? ''),
    ] as const,
  history: (params: ListHistoryParams) =>
    [
      ...paymentKeys.all,
      'history',
      sk(params.applicationSlug ?? 'alquileres'),
      sk(params.search ?? ''),
      sk(params.periodYear ?? ''),
      sk(params.periodMonth ?? ''),
      sk(params.paymentMethod ?? ''),
      sk(params.page ?? 1),
      sk(params.limit ?? 20),
    ] as const,
  overdue: (slug = 'alquileres', search?: string) =>
    [...paymentKeys.all, 'overdue', slug, search ?? ''] as const,
}

export function usePaymentStats(applicationSlug = 'alquileres') {
  return useQuery({
    queryKey: paymentKeys.stats(applicationSlug),
    queryFn: () => paymentsRepository.getStats(applicationSlug),
  })
}

export function usePendingPayments(params: Ref<ListPendingParams>) {
  return useQuery({
    queryKey: computed(() => paymentKeys.pending(params.value)),
    queryFn: () => paymentsRepository.listPending(params.value),
    placeholderData: keepPreviousData,
  })
}

export function usePaymentHistory(params: Ref<ListHistoryParams>) {
  return useQuery({
    queryKey: computed(() => paymentKeys.history(params.value)),
    queryFn: () => paymentsRepository.listHistory(params.value),
    placeholderData: keepPreviousData,
  })
}

export function useOverduePayments(applicationSlug = 'alquileres', search?: Ref<string>) {
  return useQuery({
    queryKey: computed(() => paymentKeys.overdue(applicationSlug, search?.value)),
    queryFn: () => paymentsRepository.listOverdue(applicationSlug, search?.value),
    placeholderData: keepPreviousData,
  })
}

export function useRegisterPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ paymentId, data }: { paymentId: string; data: RegisterPaymentPayload }) =>
      paymentsRepository.registerPayment(paymentId, data),
    onSuccess: () => {
      void invalidateAlquileresQueries(queryClient, 'payments')
      void markapAlert.toast.success('Pago registrado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo registrar el pago', getApiErrorMessage(err))
    },
  })
}

export function useSaveCommunicationNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ rentalId, note }: { rentalId: string; note: string }) =>
      paymentsRepository.saveCommunicationNote(rentalId, note),
    onSuccess: () => {
      void invalidateAlquileresQueries(queryClient, 'payments')
      void markapAlert.toast.success('Nota de comunicación guardada')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo guardar la nota', getApiErrorMessage(err))
    },
  })
}
