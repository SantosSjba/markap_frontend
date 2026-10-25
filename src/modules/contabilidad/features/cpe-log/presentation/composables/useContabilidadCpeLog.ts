import { contabilidadCpeLogRepositoryKey as cpeLogRepositoryKey } from '../../application/ports/contabilidad-cpe-log.port'
import { useService } from '@shared/presentation/di/services'
import { invalidateModuleQueries } from '@shared/utils/invalidateModuleQueries'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import type { CreateCpeLogBody } from '../../domain/cpe-log.types'
export const contabilidadCpeLogKeys = {
  root: ['contabilidad-cpe-log'] as const,
  list: (params: Record<string, string | undefined>) =>
    [...contabilidadCpeLogKeys.root, 'list', params] as const,
}

export function useContabilidadCpeLogs(params: Ref<Record<string, string | undefined>>) {
  const cpeLogRepository = useService(cpeLogRepositoryKey)
  return useQuery({
    queryKey: computed(() => contabilidadCpeLogKeys.list(params.value)),
    queryFn: () => cpeLogRepository.listLogs(params.value),
    staleTime: 10_000,
  })
}

export function useContabilidadCreateCpeLog() {
  const cpeLogRepository = useService(cpeLogRepositoryKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateCpeLogBody) => cpeLogRepository.createLog(body),
    onSuccess: async () => {
      await invalidateModuleQueries(qc, 'contabilidad')
      void markapAlert.toast.success('Registro CPE guardado')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo registrar', getApiErrorMessage(e)),
  })
}
