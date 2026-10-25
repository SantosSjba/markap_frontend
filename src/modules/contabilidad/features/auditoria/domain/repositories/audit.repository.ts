import type { ContabilidadAuditLogsResponse } from '../audit.types'
export interface AuditRepository {
  list(params: Record<string, string | undefined>): Promise<ContabilidadAuditLogsResponse>
}
