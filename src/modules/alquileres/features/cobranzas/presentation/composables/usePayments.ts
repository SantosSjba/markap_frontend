import { paymentsRepositoryKey } from '../../application/ports/payments.port'
import { useService } from '@shared/presentation/di/services'
import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter, type Ref } from 'vue'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { invalidateAlquileresQueries } from '../../../../presentation/queries/invalidateAlquileresQueries'
import { alquileresQueryKeys } from '../../../../application/alquileresQueryKeys'
import { sk } from '@shared/domain/stable-query-key'
import type {
  ListHistoryParams,
  ListOverdueParams,
  ListPendingParams,
  RegisterPaymentPayload,
} from '../../domain/payment.types'
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
      sk(params.rentalId ?? ''),
      sk(params.page ?? 1),
      sk(params.limit ?? 20),
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
  overdue: (params: ListOverdueParams) =>
    [
      ...paymentKeys.all,
      'overdue',
      sk(params.applicationSlug ?? 'alquileres'),
      sk(params.search ?? ''),
      sk(params.page ?? 1),
      sk(params.limit ?? 10),
    ] as const,
}

export function usePaymentStats(applicationSlug = 'alquileres') {
  const paymentsRepository = useService(paymentsRepositoryKey)
  return useQuery({
    queryKey: paymentKeys.stats(applicationSlug),
    queryFn: () => paymentsRepository.getStats(applicationSlug),
  })
}

export function usePendingPayments(
  params: Ref<ListPendingParams>,
  enabled: MaybeRefOrGetter<boolean> = true,
) {
  const paymentsRepository = useService(paymentsRepositoryKey)
  return useQuery({
    queryKey: computed(() => paymentKeys.pending(params.value)),
    queryFn: () => paymentsRepository.listPending(params.value),
    placeholderData: keepPreviousData,
    enabled: computed(() => toValue(enabled)),
  })
}

export function usePaymentHistory(params: Ref<ListHistoryParams>) {
  const paymentsRepository = useService(paymentsRepositoryKey)
  return useQuery({
    queryKey: computed(() => paymentKeys.history(params.value)),
    queryFn: () => paymentsRepository.listHistory(params.value),
    placeholderData: keepPreviousData,
  })
}

export function useOverduePayments(params: MaybeRefOrGetter<ListOverdueParams> = {}) {
  const paymentsRepository = useService(paymentsRepositoryKey)
  return useQuery({
    queryKey: computed(() => paymentKeys.overdue(toValue(params))),
    queryFn: () => paymentsRepository.listOverdue(toValue(params)),
    placeholderData: keepPreviousData,
  })
}

export function useRegisterPayment() {
  const paymentsRepository = useService(paymentsRepositoryKey)
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
  const paymentsRepository = useService(paymentsRepositoryKey)
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
