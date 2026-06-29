export const CONTABILIDAD_FINANCIAL_APP_SLUG = 'contabilidad'

export interface FinancialStatementLineDTO {
  accountId: string
  accountCode: string
  accountName: string
  accountType: string
  level: number
  amount: string
  priorAmount: string | null
}

export interface FinancialStatementSectionDTO {
  lines: FinancialStatementLineDTO[]
  total: string
}

export interface BalanceSheetDTO {
  periodId: string
  priorPeriodId: string | null
  year: number
  month: number
  asOfLabel: string
  assets: FinancialStatementSectionDTO
  liabilities: FinancialStatementSectionDTO
  equity: FinancialStatementSectionDTO
  netIncomePeriod: string
  totalLiabilitiesAndEquity: string
  isBalanced: boolean
  difference: string
}

export interface IncomeStatementDTO {
  periodId: string
  priorPeriodId: string | null
  year: number
  month: number
  income: FinancialStatementSectionDTO
  expenses: FinancialStatementSectionDTO
  netIncome: string
  priorNetIncome: string | null
}

export interface CashFlowLineDTO {
  label: string
  amount: string
  priorAmount: string | null
}

export interface CashFlowStatementDTO {
  periodId: string
  priorPeriodId: string | null
  year: number
  month: number
  method: 'INDIRECT'
  operating: CashFlowLineDTO[]
  investing: CashFlowLineDTO[]
  financing: CashFlowLineDTO[]
  netCashChange: string
  priorNetCashChange: string | null
  treasuryInTotal: string
  treasuryOutTotal: string
}
