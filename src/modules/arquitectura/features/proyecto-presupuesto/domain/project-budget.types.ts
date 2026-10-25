export interface ProjectBudgetSupplierPaymentDto {
  id: string
  paymentNumber: number
  amount: number
  paidAt: string
}

export interface ProjectBudgetLineItemDto {
  id: string
  sectionId: string
  sortOrder: number
  description: string
  budgetedCost: number
  hasIgv: boolean
  actualPurchaseCost: number | null
  supplierName: string | null
  supplierId: string | null
  utilityAmount: number
  totalBeforeIgv: number
  igvAmount: number
  price: number
  emergencyUtilityAmount: number | null
  totalSupplierPayments: number
  supplierBalance: number | null
  supplierPayments: ProjectBudgetSupplierPaymentDto[]
}

export interface ProjectBudgetSectionDto {
  id: string
  name: string
  sortOrder: number
  lineItems: ProjectBudgetLineItemDto[]
  sectionTotal: number
}

export interface ProjectBudgetDetailDto {
  projectId: string
  projectCode: string
  projectName: string
  city: string | null
  interventionLevel: string | null
  executionTimeNote: string | null
  currency: string
  defaultUtilityPct: number
  defaultIgvPct: number
  sections: ProjectBudgetSectionDto[]
  totals: {
    budgetedCostTotal: number
    utilityTotal: number
    igvTotal: number
    priceTotal: number
    actualPurchaseCostTotal: number
  }
}

export interface ProjectSettlementDto {
  budgetTotal: number
  igvTotal: number
  totalActualCost: number
  totalSupplierPayments: number
  depositsOnAccount: number
  totalClientPaid: number
  pendingToCollect: number
  milestoneUtility: number
}

export interface CreateProjectBudgetSectionPayload {
  name: string
  sortOrder?: number
}

export interface UpdateProjectBudgetSectionPayload {
  name?: string
  sortOrder?: number
}

export interface CreateProjectBudgetLineItemPayload {
  sectionId: string
  description: string
  sortOrder?: number
  budgetedCost: number
  hasIgv?: boolean
  actualPurchaseCost?: number | null
  supplierName?: string | null
}

export interface UpdateProjectBudgetLineItemPayload {
  description?: string
  sortOrder?: number
  budgetedCost?: number
  hasIgv?: boolean
  actualPurchaseCost?: number | null
  supplierName?: string | null
  supplierId?: string | null
}

export interface DuplicateBudgetSnapshotResult {
  sectionsCreated: number
  lineItemsCreated: number
  budget: ProjectBudgetDetailDto
}

export interface SyncBudgetFromExecutionResult {
  updatedLineItems: number
  unmatchedConcepts: string[]
  budget: ProjectBudgetDetailDto
}

export interface ImportBudgetFromExcelResult {
  sectionsCreated: number
  lineItemsCreated: number
  sheetName: string
  sourceFileName: string | null
  budget: ProjectBudgetDetailDto
}

export interface ProjectBudgetAttachmentDto {
  id: string
  lineItemId: string | null
  title: string
  originalFileName: string
  mimeType: string | null
  sizeBytes: number | null
  createdAt: string
}

export interface CreateLineItemSupplierPaymentPayload {
  lineItemId: string
  paymentNumber: number
  amount: number
  paidAt: string
}
