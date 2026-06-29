export interface ContabilidadAuditLogDTO {
  id: string
  legalEntityId: string | null
  legalEntityCode: string | null
  legalEntityRuc: string | null
  entityType: string
  entityId: string | null
  action: string
  userId: string | null
  summary: string | null
  payload: Record<string, unknown> | null
  createdAt: string
}

export interface ContabilidadAuditLogsResponse {
  logs: ContabilidadAuditLogDTO[]
  actionLabels: Record<string, string>
  entityTypeLabels: Record<string, string>
}
