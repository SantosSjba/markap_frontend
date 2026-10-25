import { auditRepositoryKey } from '../../application/ports/audit.port'
import { useService } from '@shared/presentation/di/services'
import { useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
export const contabilidadAuditKeys = {
  root: ['contabilidad-audit'] as const,
  logs: (params: Record<string, string | undefined>) =>
    [...contabilidadAuditKeys.root, 'logs', params] as const,
}

export function useContabilidadAuditLogs(params: Ref<Record<string, string | undefined>>) {
  const auditApiRepository = useService(auditRepositoryKey)
  return useQuery({
    queryKey: computed(() => contabilidadAuditKeys.logs(params.value)),
    queryFn: () => auditApiRepository.list(params.value),
    staleTime: 10_000,
  })
}
