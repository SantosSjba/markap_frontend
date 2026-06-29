export const CONTABILIDAD_CLOSING_APP_SLUG = 'contabilidad'

export type ClosingCheckStatus = 'ok' | 'warning' | 'error'

export interface ClosingChecklistItemDTO {
  id: string
  label: string
  status: ClosingCheckStatus
  message: string
}

export interface ClosingRegularizationLineDTO {
  accountCode: string
  accountName: string
  debit: string
  credit: string
}

export interface ClosingRegularizationPreviewDTO {
  required: boolean
  expenseTotal: string
  incomeTotal: string
  netAmount: string
  description: string | null
  lines: ClosingRegularizationLineDTO[]
}

export interface ClosingPreviewDTO {
  periodId: string
  year: number
  month: number
  periodStatus: string
  canClose: boolean
  checklist: ClosingChecklistItemDTO[]
  balanceSheetPreview: {
    totalAssets: string
    totalLiabilities: string
    totalEquity: string
    isBalanced: boolean
  }
  incomeStatementPreview: {
    netIncome: string
  }
  regularizationPreview?: ClosingRegularizationPreviewDTO | null
}
