import { computed } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { markapAlert } from '@/shared/composables'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import { activeLegalEntityIdRef } from '@modules/contabilidad/config/api-scope'
import { contabilidadSalesKeys } from '@modules/contabilidad/features/ventas-contables/application/useContabilidadSales'
import { contabilidadCpeLogKeys } from '@modules/contabilidad/features/cpe-log/application/useContabilidadCpeLog'
import type { UpsertCpeProviderConfigBody } from '../domain/cpe.types'
import { contabilidadCpeApiRepository as cpeRepository } from '../infrastructure/repositories/contabilidad-cpe.api.repository'

export const contabilidadCpeKeys = {
  root: ['contabilidad-cpe'] as const,
  providerConfig: (legalEntityId?: string) =>
    [...contabilidadCpeKeys.root, 'provider-config', legalEntityId] as const,
}

export function useContabilidadCpeProviderConfig() {
  return useQuery({
    queryKey: computed(() => contabilidadCpeKeys.providerConfig(activeLegalEntityIdRef.value)),
    queryFn: () => cpeRepository.getProviderConfig(),
    staleTime: 30_000,
  })
}

export function useContabilidadSaveCpeProviderConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: UpsertCpeProviderConfigBody) => cpeRepository.saveProviderConfig(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: contabilidadCpeKeys.root })
      void markapAlert.toast.success('Configuración CPE guardada')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo guardar', getApiErrorMessage(e)),
  })
}

export function useContabilidadEmitSalesInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (invoiceId: string) => cpeRepository.emitSalesInvoice(invoiceId),
    onSuccess: (result) => {
      void qc.invalidateQueries({ queryKey: contabilidadSalesKeys.root })
      void qc.invalidateQueries({ queryKey: contabilidadCpeLogKeys.root })
      void markapAlert.toast.success(
        result.sunatStatus === 'ACCEPTED'
          ? `Comprobante aceptado: ${result.documentRef}`
          : `Emisión registrada: ${result.documentRef}`,
      )
    },
    onError: (e) => void markapAlert.toast.error('Emisión fallida', getApiErrorMessage(e)),
  })
}

export { contabilidadCpeApiRepository } from '../infrastructure/repositories/contabilidad-cpe.api.repository'