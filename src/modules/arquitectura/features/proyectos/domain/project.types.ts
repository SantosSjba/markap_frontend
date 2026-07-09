export type ArquitecturaProjectType =
  | 'RESIDENTIAL'
  | 'COMMERCIAL'
  | 'INSTITUTIONAL'
  | 'MIXED_USE'
  | 'URBAN'

export type ArquitecturaProjectLifecycleStatus =
  | 'DESIGN'
  | 'QUOTE'
  | 'APPROVED'
  | 'IN_PROGRESS'
  | 'FINISHED'

export type ArquitecturaProjectStatus = ArquitecturaProjectLifecycleStatus | 'CANCELLED'

export interface ArquitecturaProjectClientRef {
  id: string
  fullName: string
  documentNumber: string
}

export interface ArquitecturaProjectAgentRef {
  id: string
  fullName: string
}

export interface ArquitecturaProjectListItem {
  id: string
  code: string
  name: string
  projectType: ArquitecturaProjectType
  status: ArquitecturaProjectStatus
  progressPct: number
  estimatedEndDate: string | null
  client: ArquitecturaProjectClientRef
}

export interface ArquitecturaProjectPaymentDto {
  id: string
  paidAt: string
  amount: number
  concept: string
  paymentType?: string
  status: string
  scheduleItemId?: string | null
}

export interface ArquitecturaProjectDetail extends ArquitecturaProjectListItem {
  addressLine: string | null
  city: string | null
  interventionLevel: string | null
  executionTimeNote: string | null
  currency: string
  defaultUtilityPct: number
  defaultIgvPct: number
  areaSqm: number | null
  levelsCount: number | null
  environmentsNote: string | null
  startDate: string | null
  designerAgent: ArquitecturaProjectAgentRef | null
  architectJrAgent: ArquitecturaProjectAgentRef | null
  architectSrAgent: ArquitecturaProjectAgentRef | null
  supervisorAgent: ArquitecturaProjectAgentRef | null
  commercialAgent: ArquitecturaProjectAgentRef | null
  estimatedBudget: number | null
  projectedCost: number | null
  expectedMargin: number | null
  payments: ArquitecturaProjectPaymentDto[]
}

export interface ListArquitecturaProjectsParams {
  applicationSlug?: string
  page?: number
  limit?: number
  search?: string
  status?: ArquitecturaProjectStatus
  inProgressOnly?: boolean
  clientId?: string
}

export interface ListArquitecturaProjectsResponse {
  data: ArquitecturaProjectListItem[]
  total: number
  page: number
  limit: number
}

export interface CreateArquitecturaProjectPayload {
  applicationSlug?: string
  code?: string
  name: string
  clientId: string
  projectType: ArquitecturaProjectType
  status: ArquitecturaProjectStatus
  addressLine?: string | null
  city?: string | null
  interventionLevel?: string | null
  executionTimeNote?: string | null
  currency?: string
  defaultUtilityPct?: number | null
  defaultIgvPct?: number | null
  areaSqm?: number | null
  levelsCount?: number | null
  environmentsNote?: string | null
  startDate?: string | null
  estimatedEndDate?: string | null
  designerAgentId?: string | null
  architectJrAgentId?: string | null
  architectSrAgentId?: string | null
  supervisorAgentId?: string | null
  commercialAgentId?: string | null
  estimatedBudget?: number | null
  projectedCost?: number | null
  expectedMargin?: number | null
  progressPct?: number | null
}

export interface UpdateArquitecturaProjectPayload {
  name?: string
  clientId?: string
  projectType?: ArquitecturaProjectType
  status?: ArquitecturaProjectStatus
  addressLine?: string | null
  city?: string | null
  interventionLevel?: string | null
  executionTimeNote?: string | null
  currency?: string
  defaultUtilityPct?: number | null
  defaultIgvPct?: number | null
  areaSqm?: number | null
  levelsCount?: number | null
  environmentsNote?: string | null
  startDate?: string | null
  estimatedEndDate?: string | null
  designerAgentId?: string | null
  architectJrAgentId?: string | null
  architectSrAgentId?: string | null
  supervisorAgentId?: string | null
  commercialAgentId?: string | null
  estimatedBudget?: number | null
  projectedCost?: number | null
  expectedMargin?: number | null
  progressPct?: number | null
}
