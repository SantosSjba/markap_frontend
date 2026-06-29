export type ProduccionWorkOrderStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
export type ProduccionWorkOrderPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'

export interface ProduccionWorkOrderListItem {
  id: string
  code: string
  status: ProduccionWorkOrderStatus
  priority: ProduccionWorkOrderPriority
  currentStageKey: string | null
  currentStageLabel: string | null
  progressPercent: number
  clientId: string | null
  clientName: string | null
  furnitureSummary: string
  assignedTo: string | null
  scheduledStart: string | null
  scheduledEnd: string | null
  updatedAt: string
}

export interface ProduccionWorkOrderStage {
  id: string
  stageKey: string
  label: string
  sortOrder: number
  status: 'PENDING' | 'IN_PROGRESS' | 'DONE'
  assignee: string | null
  startedAt: string | null
  completedAt: string | null
  notes: string | null
}

export interface ProduccionWorkOrderDetail {
  id: string
  code: string
  status: ProduccionWorkOrderStatus
  priority: ProduccionWorkOrderPriority
  currentStageKey: string | null
  progressPercent: number
  clientId: string | null
  clientName: string | null
  assignedTo: string | null
  scheduledStart: string | null
  scheduledEnd: string | null
  startedAt: string | null
  completedAt: string | null
  notes: string | null
  lines: {
    id: string
    furnitureId: string
    furnitureCode: string
    furnitureName: string
    quantity: number
    notes: string | null
  }[]
  stages: ProduccionWorkOrderStage[]
  consumptions: {
    id: string
    materialId: string
    materialCode: string
    materialName: string
    quantity: number
    notes: string | null
    consumedAt: string
  }[]
  updatedAt: string
}

export interface ProduccionWorkOrderStats {
  total: number
  pending: number
  inProgress: number
  completed: number
  byStage: { stageKey: string; label: string; count: number }[]
}

export interface ListWorkOrdersParams {
  page?: number
  limit?: number
  search?: string
  status?: ProduccionWorkOrderStatus
  stageKey?: string
  clientId?: string
  priority?: ProduccionWorkOrderPriority
}

export interface CreateWorkOrderPayload {
  clientId?: string | null
  priority?: ProduccionWorkOrderPriority
  assignedTo?: string | null
  scheduledStart?: string | null
  scheduledEnd?: string | null
  notes?: string | null
  lines: { furnitureId: string; quantity?: number; notes?: string | null }[]
}
