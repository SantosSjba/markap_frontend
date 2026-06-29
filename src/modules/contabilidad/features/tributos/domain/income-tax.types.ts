export const CONTABILIDAD_INCOME_TAX_APP_SLUG = 'contabilidad'

export interface ContabilidadIncomeTaxSummaryDTO {
  periodId: string
  year: number
  month: number
  totalIncome: string
  totalExpenses: string
  netIncomeBeforeTax: string
  rentaAccountBalance: string
  estimatedTaxProvision: string
}

export interface ContabilidadIncomeTaxAdjustmentsDTO {
  deductibleAdjustments: string
  nonDeductibleAdjustments: string
  otherIncomeAdjustments: string
  otherExpenseAdjustments: string
  advancePaymentAmount: string
  notes: string | null
}

export interface ContabilidadIncomeTaxRetentionLineDTO {
  id: string
  issueDate: string
  counterpartyRuc: string
  counterpartyName: string
  documentRef: string | null
  taxableBase: string
  ratePercent: string
  amount: string
}

export interface ContabilidadIncomeTaxMonthlyTrendDTO {
  periodId: string
  year: number
  month: number
  label: string
  netIncome: string
  estimatedTax: string
  accumulatedNetIncome: string
}

export interface ContabilidadIncomeTaxDetailDTO {
  periodId: string
  year: number
  month: number
  ruc: string
  legalName: string
  incomeTaxRatePercent: string
  totalIncome: string
  totalExpenses: string
  netIncomeBeforeTax: string
  taxableBase: string
  estimatedTaxProvision: string
  ytdNetIncome: string
  ytdTaxableBase: string
  ytdEstimatedTax: string
  rentaAccountBalance: string
  adjustments: ContabilidadIncomeTaxAdjustmentsDTO
  retentionsPeriod: ContabilidadIncomeTaxRetentionLineDTO[]
  retentionsPeriodTotal: string
  retentionsYtdTotal: string
  advancePaymentsYtd: string
  netTaxBalanceYtd: string
  monthlyTrend: ContabilidadIncomeTaxMonthlyTrendDTO[]
}

export interface UpsertContabilidadIncomeTaxPeriodBody {
  deductibleAdjustments?: number | string
  nonDeductibleAdjustments?: number | string
  otherIncomeAdjustments?: number | string
  otherExpenseAdjustments?: number | string
  advancePaymentAmount?: number | string
  notes?: string | null
}

export interface ContabilidadIncomeTaxExportDTO {
  periodId: string
  year: number
  month: number
  ruc: string
  legalName: string
  generatedAt: string
  detail: ContabilidadIncomeTaxDetailDTO
}
