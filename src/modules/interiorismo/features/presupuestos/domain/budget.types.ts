export interface InteriorBudgetItemInput {
  sortOrder: number
  description: string
  unit: string
  quantity: number
  unitPrice: number
  utilityPct: number
  igvPct?: number
}

export interface InteriorBudgetCategoryInput {
  sortOrder: number
  name: string
  items: InteriorBudgetItemInput[]
}

export interface InteriorBudgetEnvironmentInput {
  sortOrder: number
  name: string
  categories: InteriorBudgetCategoryInput[]
}

export interface InteriorBudgetLevelInput {
  sortOrder: number
  name: string
  environments: InteriorBudgetEnvironmentInput[]
}

export interface InteriorBudgetItemDto {
  id: string
  sortOrder: number
  description: string
  unit: string
  quantity: number
  unitPrice: number
  utilityPct: number
  igvPct: number
  baseAmount: number
  utilityAmount: number
  amountBeforeIgv: number
  igvAmount: number
  lineTotal: number
}

export interface InteriorBudgetCategoryDto {
  id: string
  sortOrder: number
  name: string
  items: InteriorBudgetItemDto[]
}

export interface InteriorBudgetEnvironmentDto {
  id: string
  sortOrder: number
  name: string
  categories: InteriorBudgetCategoryDto[]
}

export interface InteriorBudgetLevelDto {
  id: string
  sortOrder: number
  name: string
  environments: InteriorBudgetEnvironmentDto[]
}

export interface InteriorBudgetAttachmentDto {
  id: string
  title: string
  fileUrl: string
  createdAt: string
}

export interface InteriorBudgetCommentDto {
  id: string
  authorUserId: string | null
  body: string
  createdAt: string
}

export interface InteriorBudgetHistoryDto {
  id: string
  eventType: string
  summary: string
  metadata: Record<string, unknown> | null
  actorUserId: string | null
  createdAt: string
}

export interface InteriorBudgetDetail {
  id: string
  projectId: string
  code: string
  version: number
  status: string
  title: string | null
  defaultIgvPct: number
  taxableTotal: number
  igvTotal: number
  grandTotal: number
  duplicatedFromId: string | null
  createdAt: string
  updatedAt: string
  project: {
    id: string
    code: string
    name: string
    client: { id: string; fullName: string; documentNumber: string }
  }
  levels: InteriorBudgetLevelDto[]
  attachments: InteriorBudgetAttachmentDto[]
  comments: InteriorBudgetCommentDto[]
  history: InteriorBudgetHistoryDto[]
}

export interface InteriorBudgetListItem {
  id: string
  projectId: string
  code: string
  version: number
  title: string | null
  status: string
  taxableTotal: number
  igvTotal: number
  grandTotal: number
  projectCode: string
  projectName: string
  clientFullName: string
  clientDocumentNumber: string
  updatedAt: string
}

export interface ListInteriorBudgetsParams {
  applicationSlug?: string
  page?: number
  limit?: number
  search?: string
  projectId?: string
  clientId?: string
  status?: string
}

export interface ListInteriorBudgetsResponse {
  data: InteriorBudgetListItem[]
  total: number
  page: number
  limit: number
}

export interface CreateInteriorBudgetPayload {
  projectId: string
  code: string
  version?: number
  title?: string | null
  status: string
  defaultIgvPct?: number
  levels?: InteriorBudgetLevelInput[]
}

export interface UpdateInteriorBudgetPayload {
  title?: string | null
  status?: string
  defaultIgvPct?: number
  levels?: InteriorBudgetLevelInput[]
}
