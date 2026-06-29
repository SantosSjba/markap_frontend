import { useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { getContabilidadApiScope } from '@modules/contabilidad/config/api-scope'
import { apiClient } from '@core/api/apiClient'
import type { ContabilidadAuditLogsResponse } from '../domain/audit.types'

export const contabilidadAuditKeys = {
  root: ['contabilidad-audit'] as const,
  logs: (params: Record<string, string | undefined>) => [...contabilidadAuditKeys.root, 'logs', params] as const,
}

function qs(params: Record<string, string | undefined>) {
  const u = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') u.set(k, String(v))
  })
  return u.toString()
}

export function useContabilidadAuditLogs(params: Ref<Record<string, string | undefined>>) {
  return useQuery({
    queryKey: computed(() => contabilidadAuditKeys.logs(params.value)),
    queryFn: () =>
      apiClient
        .get<ContabilidadAuditLogsResponse>(`/contabilidad-audit/logs?${qs({ ...getContabilidadApiScope(), ...params.value })}`)
        .then((r) => r.data),
    staleTime: 10_000,
  })
}
