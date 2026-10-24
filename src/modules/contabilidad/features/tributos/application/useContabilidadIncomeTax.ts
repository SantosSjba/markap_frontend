import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { markapAlert } from '@/shared/composables'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import { invalidateModuleQueries } from '@/shared/utils/invalidateModuleQueries'
import type { UpsertContabilidadIncomeTaxPeriodBody } from '../domain/income-tax.types'
import {
  fetchIncomeTaxDetail,
  fetchIncomeTaxExport,
  upsertIncomeTaxPeriod,
} from '../infrastructure/contabilidad-income-tax.api.repository'

export const contabilidadIncomeTaxKeys = {
  root: ['contabilidad-income-tax'] as const,
  detail: (periodId?: string) => [...contabilidadIncomeTaxKeys.root, 'detail', periodId] as const,
}

export function invalidateContabilidadIncomeTaxCache(qc: QueryClient) {
  return invalidateModuleQueries(qc, 'contabilidad')
}

export function useContabilidadIncomeTaxDetail(periodId: Ref<string | undefined>) {
  return useQuery({
    queryKey: computed(() => contabilidadIncomeTaxKeys.detail(periodId.value)),
    queryFn: () => fetchIncomeTaxDetail(periodId.value!),
    enabled: computed(() => Boolean(periodId.value)),
    staleTime: 15_000,
  })
}

export function useContabilidadUpsertIncomeTaxPeriod() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ periodId, body }: { periodId: string; body: UpsertContabilidadIncomeTaxPeriodBody }) =>
      upsertIncomeTaxPeriod(periodId, body),
    onSuccess: async () => {
      await invalidateContabilidadIncomeTaxCache(qc)
      await invalidateModuleQueries(qc, 'contabilidad')
      void markapAlert.toast.success('Borrador IR guardado')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo guardar', getApiErrorMessage(e)),
  })
}

export async function fetchContabilidadIncomeTaxExport(periodId: string) {
  return fetchIncomeTaxExport(periodId)
}
