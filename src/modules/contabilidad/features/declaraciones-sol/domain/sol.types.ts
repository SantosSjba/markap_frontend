export const SOL_DECLARATION_STATUS = {
  PREPARED: 'PREPARED',
  MANUAL_PENDING: 'MANUAL_PENDING',
  SUBMITTED: 'SUBMITTED',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
} as const

export interface ContabilidadSolCredentialsDTO {
  id: string
  legalEntityId: string
  legalEntityCode: string
  legalEntityRuc: string
  solUser: string
  solPasswordHint: string | null
  hasSolPassword: boolean
  useSandbox: boolean
  isActive: boolean
  updatedAt: string
}

export interface ContabilidadSunatDeclarationLogDTO {
  id: string
  legalEntityId: string
  legalEntityCode: string
  legalEntityRuc: string
  periodId: string
  periodYear: number
  periodMonth: number
  declarationType: string
  status: string
  sunatResponseCode: string | null
  sunatResponseMessage: string | null
  packageHash: string | null
  submittedAt: string | null
  acceptedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface UpsertSolCredentialsBody {
  solUser: string
  solPassword?: string | null
  useSandbox?: boolean
  isActive?: boolean
}

export interface ContabilidadSolPdt621PackageDTO {
  logId: string
  declarationType: string
  status: string
  packageHash: string
  package: Record<string, unknown>
  manualInstructions: string[]
}

export function solStatusVariant(
  status: string,
): 'success' | 'warning' | 'neutral' | 'error' | 'info' {
  if (status === SOL_DECLARATION_STATUS.ACCEPTED) return 'success'
  if (status === SOL_DECLARATION_STATUS.REJECTED) return 'error'
  if (status === SOL_DECLARATION_STATUS.MANUAL_PENDING) return 'warning'
  if (status === SOL_DECLARATION_STATUS.SUBMITTED) return 'info'
  return 'neutral'
}
