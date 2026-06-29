import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { markapAlert } from '@/shared/composables'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import type { CreateCpeLogBody } from '../domain/cpe-log.types'
import { contabilidadCpeLogApiRepository as cpeLogRepository } from '../infrastructure/repositories/contabilidad-cpe-log.api.repository'

export const contabilidadCpeLogKeys = {
  root: ['contabilidad-cpe-log'] as const,
  list: (params: Record<string, string | undefined>) =>
    [...contabilidadCpeLogKeys.root, 'list', params] as const,
}

export function useContabilidadCpeLogs(params: Ref<Record<string, string | undefined>>) {
  return useQuery({
    queryKey: computed(() => contabilidadCpeLogKeys.list(params.value)),
    queryFn: () => cpeLogRepository.listLogs(params.value),
    staleTime: 10_000,
  })
}

export function useContabilidadCreateCpeLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateCpeLogBody) => cpeLogRepository.createLog(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: contabilidadCpeLogKeys.root })
      void markapAlert.toast.success('Registro CPE guardado')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo registrar', getApiErrorMessage(e)),
  })
}
