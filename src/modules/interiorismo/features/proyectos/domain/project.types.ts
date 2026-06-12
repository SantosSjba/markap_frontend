export type InteriorProjectType =
  | 'REMODELING'
  | 'INTERIOR_DESIGN'
  | 'IMPLEMENTATION'
  | 'FURNITURE'

export type InteriorProjectLifecycleStatus =
  | 'DESIGN'
  | 'QUOTE'
  | 'APPROVED'
  | 'IN_PROGRESS'
  | 'FINISHED'

export type InteriorProjectStatus = InteriorProjectLifecycleStatus | 'CANCELLED'

export interface InteriorProjectClientRef {
  id: string
  fullName: string
  documentNumber: string
}

export interface InteriorProjectAgentRef {
  id: string
  fullName: string
}

export interface InteriorProjectListItem {
  id: string
  code: string
  name: string
  projectType: InteriorProjectType
  status: InteriorProjectStatus
  progressPct: number
  estimatedEndDate: string | null
  client: InteriorProjectClientRef
}

export interface InteriorProjectBudgetDto {
  id: string
  code: string | null
  title: string | null
  version: number
  totalAmount: number
  status: string
}

export interface InteriorProjectMaterialDto {
  id: string
  name: string
  quantity: number | null
  unit: string | null
  estimatedCost: number | null
}

export interface InteriorProjectDocumentDto {
  id: string
  docType: string
  title: string
  fileUrl: string | null
}

export interface InteriorProjectPaymentDto {
  id: string
  paidAt: string
  amount: number
  concept: string
  status: string
}

export interface InteriorProjectActivityDto {
  id: string
  activityType: string
  title: string
  description: string | null
  occurredAt: string
}

export interface InteriorProjectMilestoneDto {
  id: string
  title: string
  plannedDate: string
  completedAt: string | null
}

export interface InteriorProjectDetail extends InteriorProjectListItem {
  addressLine: string | null
  areaSqm: number | null
  levelsCount: number | null
  environmentsNote: string | null
  startDate: string | null
  designerAgent: InteriorProjectAgentRef | null
  architectAgent: InteriorProjectAgentRef | null
  supervisorAgent: InteriorProjectAgentRef | null
  commercialAgent: InteriorProjectAgentRef | null
  estimatedBudget: number | null
  projectedCost: number | null
  expectedMargin: number | null
  budgets: InteriorProjectBudgetDto[]
  materials: InteriorProjectMaterialDto[]
  documents: InteriorProjectDocumentDto[]
  payments: InteriorProjectPaymentDto[]
  activities: InteriorProjectActivityDto[]
  milestones: InteriorProjectMilestoneDto[]
}

export interface ListInteriorProjectsParams {
  applicationSlug?: string
  page?: number
  limit?: number
  search?: string
  status?: InteriorProjectStatus
  inProgressOnly?: boolean
  clientId?: string
}

export interface ListInteriorProjectsResponse {
  data: InteriorProjectListItem[]
  total: number
  page: number
  limit: number
}

export interface CreateInteriorProjectPayload {
  applicationSlug?: string
  code: string
  name: string
  clientId: string
  projectType: InteriorProjectType
  status: InteriorProjectStatus
  addressLine?: string | null
  areaSqm?: number | null
  levelsCount?: number | null
  environmentsNote?: string | null
  startDate?: string | null
  estimatedEndDate?: string | null
  designerAgentId?: string | null
  architectAgentId?: string | null
  supervisorAgentId?: string | null
  commercialAgentId?: string | null
  estimatedBudget?: number | null
  projectedCost?: number | null
  expectedMargin?: number | null
  progressPct?: number | null
}

/** PATCH `/interiorismo-projects/:id` (el código no es editable tras crear) */
export interface UpdateInteriorProjectPayload {
  name?: string
  clientId?: string
  projectType?: InteriorProjectType
  status?: InteriorProjectStatus
  addressLine?: string | null
  areaSqm?: number | null
  levelsCount?: number | null
  environmentsNote?: string | null
  startDate?: string | null
  estimatedEndDate?: string | null
  designerAgentId?: string | null
  architectAgentId?: string | null
  supervisorAgentId?: string | null
  commercialAgentId?: string | null
  estimatedBudget?: number | null
  projectedCost?: number | null
  expectedMargin?: number | null
  progressPct?: number | null
}
