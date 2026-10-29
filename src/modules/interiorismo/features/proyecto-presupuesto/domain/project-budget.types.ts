/** Presupuesto tipo hoja (contrato de `GET /interiorismo-projects/:id/budget`). */

export type BudgetRowKind = 'GROUP' | 'ITEM' | 'NOTE'
export type BudgetMarginMode = 'PER_LINE' | 'GLOBAL'
export type BudgetIgvMode = 'PER_LINE' | 'GLOBAL' | 'NONE'
export type BudgetStatus = 'DRAFT' | 'SENT' | 'APPROVED'
export type BudgetRowStatus = 'PENDING' | 'QUOTED' | 'PURCHASED' | 'GIFT'

export interface BudgetSupplierPaymentDto {
  id: string
  amount: number
  paidAt: string
  note: string | null
}

export interface BudgetSheetRowDto {
  id: string
  parentId: string | null
  sortOrder: number
  kind: BudgetRowKind
  /** Código mostrado (manual o automático) */
  code: string
  /** Código escrito a mano; null = automático */
  manualCode: string | null
  description: string
  unit: string | null
  quantity: number | null
  unitPrice: number | null
  /** Costo escrito a mano (sobrescribe metrado × P.U.) */
  directCost: number | null
  actualCost: number | null
  utilityPctOverride: number | null
  hasIgv: boolean
  supplierId: string | null
  supplierName: string | null
  status: BudgetRowStatus
  note: string | null
  supplierPayments: BudgetSupplierPaymentDto[]
  supplierPaymentsTotal: number
  // ── Calculados ──
  depth: number
  childrenCount: number
  cost: number
  utility: number
  total: number
  igv: number
  price: number
  deviation: number | null
  supplierBalance: number | null
}

export interface BudgetHeaderDto {
  id: string
  projectId: string
  version: number
  isActive: boolean
  number: string | null
  issuedAt: string | null
  executionTerm: string | null
  executedBy: string | null
  status: BudgetStatus
  currency: string
  exchangeRate: number | null
  exchangeRateDate: string | null
  marginMode: BudgetMarginMode
  utilityPct: number
  overheadPct: number
  igvMode: BudgetIgvMode
  igvPct: number
  terms: string | null
  visibleColumns: string[] | null
}

export interface BudgetSheetTotals {
  directCost: number
  utility: number
  overhead: number
  subtotal: number
  igv: number
  total: number
  actualCost: number
  supplierPayments: number
  equivalent: { currency: string; amount: number } | null
}

export interface BudgetVersionDto {
  id: string
  version: number
  isActive: boolean
  status: BudgetStatus
  createdAt: string
}

export interface BudgetSheetDto {
  project: { id: string; code: string; name: string; currency: string }
  budget: BudgetHeaderDto
  versions: BudgetVersionDto[]
  rows: BudgetSheetRowDto[]
  totals: BudgetSheetTotals
}

export interface ProjectSettlementDto {
  currency: string
  budgetTotal: number
  igvTotal: number
  depositsOnAccount: number
  totalClientPaid: number
  pendingToCollect: number
  /** Cobros programados aún no confirmados */
  scheduledPayments: number
  totalActualCost: number
  totalSupplierPayments: number
  supplierBalance: number
  /** Ingreso sin IGV (el IGV se paga a SUNAT) */
  netRevenue: number
  /** Costo presupuestado de las partidas que aún no tienen costo real */
  pendingCost: number
  /** Utilidad estimada: ingreso sin IGV − costo real − costo pendiente */
  milestoneUtility: number
  marginPct: number | null
  /** Cobros confirmados en otra moneda (monto original) */
  paidByCurrency: { currency: string; amount: number }[]
  /** Cobros sin tipo de cambio: no descuentan el saldo */
  unconverted: { currency: string; amount: number }[]
}

export type UpdateBudgetHeaderPayload = Partial<
  Omit<BudgetHeaderDto, 'id' | 'projectId' | 'version' | 'isActive'>
>

/** Celdas editables de una fila */
export interface BudgetRowFields {
  kind?: BudgetRowKind
  code?: string | null
  description?: string
  unit?: string | null
  quantity?: number | null
  unitPrice?: number | null
  directCost?: number | null
  actualCost?: number | null
  utilityPctOverride?: number | null
  hasIgv?: boolean
  supplierId?: string | null
  supplierName?: string | null
  status?: BudgetRowStatus
  note?: string | null
}

export interface CreateBudgetRowsPayload {
  parentId: string | null
  afterRowId: string | null
  rows: BudgetRowFields[]
}

export interface CreateBudgetRowsResult extends BudgetSheetDto {
  createdRowIds: string[]
}

export interface MoveBudgetRowPayload {
  parentId: string | null
  index: number
}

export interface CreateBudgetSupplierPaymentPayload {
  amount: number
  paidAt: string
  note?: string | null
}

export interface SyncBudgetFromExecutionResult {
  updatedRows: number
  unmatchedConcepts: string[]
  sheet: BudgetSheetDto
}

export interface ImportBudgetFromExcelResult extends BudgetSheetDto {
  rowsCreated: number
  import: {
    sheetName: string
    format: 'MARKAP_SPACES' | 'PRIZE'
    warnings: string[]
    sourceFileName: string | null
  }
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
