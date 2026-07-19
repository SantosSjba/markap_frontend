export interface ArquitecturaExecutionMilestoneDto {
  id: string
  title: string
  plannedDate: string
  completedAt: string | null
}

export interface ArquitecturaExecutionTaskDto {
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

export interface ArquitecturaExecutionEvidenceDto {
  id: string
  projectId: string
  taskId: string | null
  kind: string
  title: string
  fileUrl: string
  archivoId: string | null
  downloadUrl?: string | null
  capturedAt: string
}

export interface ArquitecturaExecutionIncidentDto {
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

export interface ArquitecturaExecutionActualCostDto {
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

export interface ArquitecturaExecutionBudgetReferenceDto {
  budgetId: string | null
  code: string | null
  version: number | null
  grandTotal: number | null
}

export interface ArquitecturaExecutionCostTotalsDto {
  labor: number
  material: number
  expense: number
  transport: number
  total: number
}

export interface ArquitecturaExecutionOverviewDto {
  projectId: string
  projectCode: string
  projectName: string
  progressPct: number
  milestones: ArquitecturaExecutionMilestoneDto[]
  tasks: ArquitecturaExecutionTaskDto[]
  evidences: ArquitecturaExecutionEvidenceDto[]
  incidents: ArquitecturaExecutionIncidentDto[]
  actualCosts: ArquitecturaExecutionActualCostDto[]
  costTotals: ArquitecturaExecutionCostTotalsDto
  budgetReference: ArquitecturaExecutionBudgetReferenceDto
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

export interface UploadExecutionEvidencePayload {
  taskId?: string | null
  kind: string
  title: string
  file: File
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
