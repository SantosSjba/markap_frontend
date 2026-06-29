import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { markapAlert } from '@/shared/composables'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import { invalidateQuerySubtree } from '@/shared/utils/invalidateQuerySubtree'
import type {
  CreateDetraccionBody,
  CreatePerceptionBody,
  CreateRetentionBody,
  PayDetraccionBody,
} from '../domain/taxes.types'
import { contabilidadTaxesApiRepository as taxesRepository } from '../infrastructure/repositories/contabilidad-taxes.api.repository'

export const contabilidadTaxesKeys = {
  root: ['contabilidad-taxes'] as const,
  dashboard: (periodId?: string) => [...contabilidadTaxesKeys.root, 'dashboard', periodId] as const,
  detraccionRates: () => [...contabilidadTaxesKeys.root, 'detraccion-rates'] as const,
  detracciones: (params: Record<string, string | undefined>) =>
    [...contabilidadTaxesKeys.root, 'detracciones', params] as const,
  retentions: (params: Record<string, string | undefined>) =>
    [...contabilidadTaxesKeys.root, 'retentions', params] as const,
  perceptions: (params: Record<string, string | undefined>) =>
    [...contabilidadTaxesKeys.root, 'perceptions', params] as const,
}

export function invalidateContabilidadTaxesCache(qc: QueryClient) {
  return invalidateQuerySubtree(qc, contabilidadTaxesKeys.root)
}

export function useContabilidadTaxDashboard(periodId: Ref<string | undefined>) {
  return useQuery({
    queryKey: computed(() => contabilidadTaxesKeys.dashboard(periodId.value)),
    queryFn: () => taxesRepository.getDashboard(periodId.value),
    staleTime: 10_000,
  })
}

export function useContabilidadDetraccionRates() {
  return useQuery({
    queryKey: contabilidadTaxesKeys.detraccionRates(),
    queryFn: () => taxesRepository.listDetraccionRates(),
    staleTime: 60_000,
  })
}

export function useContabilidadDetracciones(params: Ref<Record<string, string | undefined>>) {
  return useQuery({
    queryKey: computed(() => contabilidadTaxesKeys.detracciones(params.value)),
    queryFn: () => taxesRepository.listDetracciones(params.value),
    staleTime: 10_000,
  })
}

export function useContabilidadCreateDetraccion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateDetraccionBody) => taxesRepository.createDetraccion(body),
    onSuccess: () => {
      void invalidateContabilidadTaxesCache(qc)
      void markapAlert.toast.success('Detracción registrada')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo registrar', getApiErrorMessage(e)),
  })
}

export function useContabilidadPayDetraccion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: PayDetraccionBody }) =>
      taxesRepository.payDetraccion(id, body),
    onSuccess: () => {
      void invalidateContabilidadTaxesCache(qc)
      void markapAlert.toast.success('Pago SPOT registrado')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo pagar', getApiErrorMessage(e)),
  })
}

export function useContabilidadRetentions(params: Ref<Record<string, string | undefined>>) {
  return useQuery({
    queryKey: computed(() => contabilidadTaxesKeys.retentions(params.value)),
    queryFn: () => taxesRepository.listRetentions(params.value),
    staleTime: 10_000,
  })
}

export function useContabilidadCreateRetention() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateRetentionBody) => taxesRepository.createRetention(body),
    onSuccess: () => {
      void invalidateContabilidadTaxesCache(qc)
      void markapAlert.toast.success('Retención registrada')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo registrar', getApiErrorMessage(e)),
  })
}

export function useContabilidadPerceptions(params: Ref<Record<string, string | undefined>>) {
  return useQuery({
    queryKey: computed(() => contabilidadTaxesKeys.perceptions(params.value)),
    queryFn: () => taxesRepository.listPerceptions(params.value),
    staleTime: 10_000,
  })
}

export function useContabilidadCreatePerception() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreatePerceptionBody) => taxesRepository.createPerception(body),
    onSuccess: () => {
      void invalidateContabilidadTaxesCache(qc)
      void markapAlert.toast.success('Percepción registrada')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo registrar', getApiErrorMessage(e)),
  })
}

export async function fetchContabilidadPdt621Export(periodId: string) {
  return taxesRepository.exportPdt621(periodId)
}
