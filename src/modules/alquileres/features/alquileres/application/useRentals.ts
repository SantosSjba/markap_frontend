import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, unref, type Ref } from 'vue'
import { markapAlert } from '@/shared/composables'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import {
  invalidateAlquileresQueries,
  refetchAlquileresQueries,
} from '@modules/alquileres/application'
import { alquileresQueryKeys } from '@modules/alquileres/application/alquileresQueryKeys'
import { sk } from '@modules/alquileres/application/stableQueryKey'
import type {
  CreateRentalPayload,
  ListRentalsParams,
  UpdateRentalPayload,
  UpsertRentalFinancialConfigPayload,
} from '../domain/rental.types'
import { ALQUILERES_APP_SLUG } from '../../../config/app.constants'
import { rentalsApiRepository as rentalsRepository } from '../infrastructure/repositories/rentals.api.repository'

export const rentalKeys = {
  all: alquileresQueryKeys.rentals,
  list: (params: ListRentalsParams) =>
    [
      ...rentalKeys.all,
      'list',
      sk(params.applicationSlug ?? 'alquileres'),
      sk(params.page ?? 1),
      sk(params.limit ?? 10),
      sk(params.search ?? ''),
      sk(params.status ?? ''),
    ] as const,
  stats: (slug?: string) => [...rentalKeys.all, 'stats', slug ?? ALQUILERES_APP_SLUG] as const,
  detail: (id: string) => [...rentalKeys.all, 'detail', id] as const,
  financialConfig: (id: string) => [...rentalKeys.all, 'financial-config', id] as const,
  financialBreakdown: (id: string) => [...rentalKeys.all, 'financial-breakdown', id] as const,
}

export function useRentalsList(params: Ref<ListRentalsParams>) {
  return useQuery({
    queryKey: computed(() => rentalKeys.list(params.value)),
    queryFn: () => rentalsRepository.getList(params.value),
  })
}

export function useRentalStats(applicationSlug = ALQUILERES_APP_SLUG) {
  return useQuery({
    queryKey: rentalKeys.stats(applicationSlug),
    queryFn: () => rentalsRepository.getStats(applicationSlug),
  })
}

export function useRental(id: Ref<string> | string) {
  return useQuery({
    queryKey: computed(() => rentalKeys.detail(unref(id))),
    queryFn: () => rentalsRepository.getById(unref(id)),
    enabled: computed(() => !!unref(id)),
  })
}

export function useCreateRental() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (params: {
      data: CreateRentalPayload
      files?: { contractFile?: File; deliveryActFile?: File }
    }) => rentalsRepository.create(params.data, params.files),
    onSuccess: () => {
      void invalidateAlquileresQueries(queryClient, 'rentals')
      void markapAlert.toast.success('Contrato de alquiler creado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo crear el contrato', getApiErrorMessage(err))
    },
  })
  return {
    ...mutation,
    invalidateList: () => refetchAlquileresQueries(queryClient, 'rentals'),
  }
}

export function useUpdateRental() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: ({
      id,
      data,
      files,
    }: {
      id: string
      data: UpdateRentalPayload
      files?: { contractFile?: File; deliveryActFile?: File }
    }) => rentalsRepository.update(id, data, files),
    onSuccess: () => {
      void invalidateAlquileresQueries(queryClient, 'rentals')
      void markapAlert.toast.success('Contrato actualizado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo guardar el contrato', getApiErrorMessage(err))
    },
  })
  return {
    ...mutation,
    invalidateList: () => refetchAlquileresQueries(queryClient, 'rentals'),
  }
}

export function useRentalFinancialConfig(id: Ref<string> | string) {
  return useQuery({
    queryKey: computed(() => rentalKeys.financialConfig(unref(id))),
    queryFn: () => rentalsRepository.getFinancialConfig(unref(id)),
    enabled: computed(() => !!unref(id)),
  })
}

export function useRentalFinancialBreakdown(id: Ref<string> | string) {
  return useQuery({
    queryKey: computed(() => rentalKeys.financialBreakdown(unref(id))),
    queryFn: () => rentalsRepository.getFinancialBreakdown(unref(id)),
    enabled: computed(() => !!unref(id)),
  })
}

export function useUpsertRentalFinancialConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ rentalId, data }: { rentalId: string; data: UpsertRentalFinancialConfigPayload }) =>
      rentalsRepository.upsertFinancialConfig(rentalId, data),
    onSuccess: () => {
      void invalidateAlquileresQueries(queryClient, 'rentals')
      void markapAlert.toast.success('Distribución financiera guardada')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo guardar la distribución', getApiErrorMessage(err))
    },
  })
}

export function useCancelRental() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => rentalsRepository.cancel(id),
    onSuccess: () => {
      void invalidateAlquileresQueries(queryClient, 'rentals')
      void markapAlert.toast.success('Contrato anulado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo anular el contrato', getApiErrorMessage(err))
    },
  })
}
