import { apiClient } from '@shared/infrastructure/http/api-client'
import { getContabilidadApiScope } from '../../../../config/api-scope'
import type { AuditRepository } from '../../domain/repositories/audit.repository'
export const auditApiRepository: AuditRepository = {
  list: (params) => {
    const qs = new URLSearchParams()
    Object.entries({ ...getContabilidadApiScope(), ...params }).forEach(([key, value]) => {
      if (value !== undefined && value !== '') qs.set(key, value)
    })
    return apiClient.get(`/contabilidad-audit/logs?${qs}`).then((response) => response.data)
  },
}
