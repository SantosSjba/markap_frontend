export const CONTABILIDAD_REPORTS_APP_SLUG = 'contabilidad'

export interface ContabilidadDashboardKpiDTO {
  key: string
  label: string
  value: string
  format: 'money' | 'number' | 'percent' | 'text'
  hint?: string | null
}

export interface ContabilidadDashboardActivityDTO {
  id: string
  title: string
  detail: string
  occurredAt: string
  tone: 'primary' | 'success' | 'muted'
}

export interface ContabilidadDashboardDTO {
  periodId: string
  year: number
  month: number
  kpis: ContabilidadDashboardKpiDTO[]
  recentActivity: ContabilidadDashboardActivityDTO[]
}

export interface TrialBalanceLineDTO {
  accountId: string
  accountCode: string
  accountName: string
  accountType: string
  totalDebit: string
  totalCredit: string
  balance: string
}

export interface TrialBalanceDTO {
  periodId: string
  year: number
  month: number
  lines: TrialBalanceLineDTO[]
  totalDebit: string
  totalCredit: string
  isBalanced: boolean
}

export interface FinancialRatioDTO {
  key: string
  label: string
  value: string | null
  priorValue: string | null
  unit: 'ratio' | 'percent' | 'money'
  description: string
}

export interface FinancialAnalysisDTO {
  periodId: string
  priorPeriodId: string | null
  year: number
  month: number
  ratios: FinancialRatioDTO[]
}

export interface CashFlowTreasuryRowDTO {
  movementType: string
  label: string
  inAmount: string
  outAmount: string
  netAmount: string
}

export interface CashFlowTreasuryDTO {
  periodId: string
  year: number
  month: number
  rows: CashFlowTreasuryRowDTO[]
  totalIn: string
  totalOut: string
  netChange: string
  cashIn: string
  cashOut: string
  bankIn: string
  bankOut: string
}
