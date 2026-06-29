export const CPE_ELECTRONIC_STATUS = {
  NONE: 'NONE',
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
} as const

export const CPE_PROVIDER_OPTIONS = [
  { value: 'MOCK', label: 'Simulador (sandbox)' },
  { value: 'NUBEFACT', label: 'Nubefact' },
  { value: 'BIZLINKS', label: 'Bizlinks' },
  { value: 'SUNAT', label: 'SUNAT directo' },
] as const

export const CPE_ELECTRONIC_STATUS_LABELS: Record<string, string> = {
  NONE: 'Sin emitir',
  DRAFT: 'Borrador',
  SENT: 'Enviado',
  ACCEPTED: 'Aceptado SUNAT',
  REJECTED: 'Rechazado',
}

export interface ContabilidadCpeProviderConfigDTO {
  id: string
  legalEntityId: string
  legalEntityCode: string
  legalEntityRuc: string
  providerCode: string
  apiBaseUrl: string | null
  apiTokenHint: string | null
  hasApiToken: boolean
  certificateHint: string | null
  useSandbox: boolean
  isActive: boolean
  updatedAt: string
}

export interface ContabilidadCpeProviderConfigResponse {
  config: ContabilidadCpeProviderConfigDTO
  providerLabels: Record<string, string>
  statusLabels?: Record<string, string>
}

export interface UpsertCpeProviderConfigBody {
  providerCode: string
  apiBaseUrl?: string | null
  apiToken?: string | null
  certificateHint?: string | null
  useSandbox?: boolean
  isActive?: boolean
}

export interface ContabilidadCpeEmitResultDTO {
  logId: string
  sourceType: string
  sourceId: string
  documentRef: string
  sunatStatus: string
  sunatResponseCode: string | null
  sunatResponseMessage: string | null
  xmlHash: string | null
  cdrReference: string | null
  electronicStatus: string
}

export function cpeElectronicStatusVariant(
  status: string,
): 'success' | 'warning' | 'neutral' | 'error' | 'info' {
  if (status === CPE_ELECTRONIC_STATUS.ACCEPTED) return 'success'
  if (status === CPE_ELECTRONIC_STATUS.REJECTED) return 'error'
  if (status === CPE_ELECTRONIC_STATUS.SENT) return 'info'
  if (status === CPE_ELECTRONIC_STATUS.DRAFT) return 'warning'
  return 'neutral'
}
