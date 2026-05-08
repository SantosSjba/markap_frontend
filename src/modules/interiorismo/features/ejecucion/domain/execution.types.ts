export interface InteriorExecutionMilestoneDto {
  id: string
  title: string
  plannedDate: string
  completedAt: string | null
}

export interface InteriorExecutionTaskDto {
  id: string
  projectId: string
  phase: string
  title: string
  description: string | null
  kanbanStatus: string
  sortOrder: number
  plannedStart: string | null
  plannedEnd: string | null
  progressPct: number
  updatedAt: string
}

export interface InteriorExecutionEvidenceDto {
  id: string
  projectId: string
  taskId: string | null
  kind: string
  title: string
  fileUrl: string
  capturedAt: string
}

export interface InteriorExecutionIncidentDto {
  id: string
  projectId: string
  severity: string
  title: string
  description: string | null
  status: string
  reportedAt: string
  closedAt: string | null
  updatedAt: string
}

export interface InteriorExecutionActualCostDto {
  id: string
  projectId: string
  costCategory: string
  concept: string
  amount: number
  occurredAt: string
  catalogMaterialId: string | null
  materialCode: string | null
  materialName: string | null
}

export interface InteriorExecutionBudgetReferenceDto {
  budgetId: string | null
  code: string | null
  version: number | null
  grandTotal: number | null
}

export interface InteriorExecutionCostTotalsDto {
  labor: number
  material: number
  expense: number
  total: number
}

export interface InteriorExecutionOverviewDto {
  projectId: string
  projectCode: string
  projectName: string
  progressPct: number
  milestones: InteriorExecutionMilestoneDto[]
  tasks: InteriorExecutionTaskDto[]
  evidences: InteriorExecutionEvidenceDto[]
  incidents: InteriorExecutionIncidentDto[]
  actualCosts: InteriorExecutionActualCostDto[]
  costTotals: InteriorExecutionCostTotalsDto
  budgetReference: InteriorExecutionBudgetReferenceDto
  varianceVsBudget: number | null
}

export interface CreateExecutionTaskPayload {
  phase: string
  title: string
  description?: string | null
  kanbanStatus?: string
  plannedStart?: string | null
  plannedEnd?: string | null
  progressPct?: number
}

export interface UpdateExecutionTaskPayload {
  phase?: string
  title?: string
  description?: string | null
  kanbanStatus?: string
  sortOrder?: number
  plannedStart?: string | null
  plannedEnd?: string | null
  progressPct?: number
}

export interface CreateExecutionEvidencePayload {
  taskId?: string | null
  kind: string
  title: string
  fileUrl: string
  capturedAt: string
}

export interface CreateExecutionIncidentPayload {
  severity: string
  title: string
  description?: string | null
  reportedAt: string
}

export interface UpdateExecutionIncidentPayload {
  status?: string
  severity?: string
  title?: string
  description?: string | null
  closedAt?: string | null
}

export interface CreateExecutionActualCostPayload {
  costCategory: string
  concept: string
  amount: number
  occurredAt: string
  catalogMaterialId?: string | null
}
