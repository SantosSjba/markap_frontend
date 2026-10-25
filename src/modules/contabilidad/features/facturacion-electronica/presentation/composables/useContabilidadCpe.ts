import { contabilidadCpeRepositoryKey as cpeRepositoryKey } from '../../application/ports/contabilidad-cpe.port'
import { useService } from '@shared/presentation/di/services'
import { invalidateModuleQueries } from '@shared/utils/invalidateModuleQueries'
import { computed } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { activeLegalEntityIdRef } from '../../../../config/api-scope'
import type { UpsertCpeProviderConfigBody } from '../../domain/cpe.types'
export const contabilidadCpeKeys = {
  root: ['contabilidad-cpe'] as const,
  providerConfig: (legalEntityId?: string) =>
    [...contabilidadCpeKeys.root, 'provider-config', legalEntityId] as const,
}

export function useContabilidadCpeProviderConfig() {
  const cpeRepository = useService(cpeRepositoryKey)
  return useQuery({
    queryKey: computed(() => contabilidadCpeKeys.providerConfig(activeLegalEntityIdRef.value)),
    queryFn: () => cpeRepository.getProviderConfig(),
    staleTime: 30_000,
  })
}

export function useContabilidadSaveCpeProviderConfig() {
  const cpeRepository = useService(cpeRepositoryKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: UpsertCpeProviderConfigBody) => cpeRepository.saveProviderConfig(body),
    onSuccess: async () => {
      await invalidateModuleQueries(qc, 'contabilidad')
      void markapAlert.toast.success('Configuración CPE guardada')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo guardar', getApiErrorMessage(e)),
  })
}

export function useContabilidadEmitSalesInvoice() {
  const cpeRepository = useService(cpeRepositoryKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (invoiceId: string) => cpeRepository.emitSalesInvoice(invoiceId),
    onSuccess: async (result) => {
      await invalidateModuleQueries(qc, 'contabilidad')
      void markapAlert.toast.success(
        result.sunatStatus === 'ACCEPTED'
          ? `Comprobante aceptado: ${result.documentRef}`
          : `Emisión registrada: ${result.documentRef}`,
      )
    },
    onError: (e) => void markapAlert.toast.error('Emisión fallida', getApiErrorMessage(e)),
  })
}
