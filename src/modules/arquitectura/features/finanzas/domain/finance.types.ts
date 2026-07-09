export interface ArquitecturaFinanceBudgetRefDto {
  id: string
  code: string
  version: number
  grandTotal: number
  taxableTotal: number
  igvTotal: number
  status: string
}

export interface ArquitecturaFinanceScheduleDto {
  id: string
  kind: string
  dueDate: string
  amount: number
  concept: string
  sortOrder: number
  status: string
  paidTowardSchedule: number
}

export interface ArquitecturaFinancePaymentDto {
  id: string
  paidAt: string
  amount: number
  concept: string
  paymentType: string
  status: string
  scheduleItemId: string | null
}

export interface ArquitecturaFinanceExpenseLineDto {
  id: string
  costCategory: string
  concept: string
  amount: number
  occurredAt: string
}

export interface ArquitecturaFinanceIncomeSummaryDto {
  scheduledTotal: number
  advancesScheduled: number
  installmentsScheduled: number
  collectedConfirmed: number
  pendingFromClient: number
}

export interface ArquitecturaFinanceExpenseSummaryDto {
  purchases: number
  labor: number
  transport: number
  otherExpenses: number
  totalOut: number
}

export interface ArquitecturaFinanceProfitabilityDto {
  contractValue: number
  totalScheduled: number
  totalCollected: number
  totalActualCosts: number
  budgetVsCosts: number
  collectedVsCosts: number
  marginOnCollectedPct: number | null
}

export interface ArquitecturaFinanceCashFlowMonthDto {
  month: string
  inflow: number
  outflow: number
  net: number
}

export interface ArquitecturaFinanceMovementDto {
  occurredAt: string
  direction: 'IN' | 'OUT'
  concept: string
  amount: number
  refKind: 'PAYMENT' | 'COST'
}

export interface ArquitecturaFinanceOverviewDto {
  projectId: string
  projectCode: string
  projectName: string
  budgetReference: ArquitecturaFinanceBudgetRefDto | null
  schedules: ArquitecturaFinanceScheduleDto[]
  payments: ArquitecturaFinancePaymentDto[]
  expenseLines: ArquitecturaFinanceExpenseLineDto[]
  incomeSummary: ArquitecturaFinanceIncomeSummaryDto
  expenseSummary: ArquitecturaFinanceExpenseSummaryDto
  profitability: ArquitecturaFinanceProfitabilityDto
  cashFlowByMonth: ArquitecturaFinanceCashFlowMonthDto[]
  recentMovements: ArquitecturaFinanceMovementDto[]
}

export interface CreateFinanceSchedulePayload {
  kind: string
  dueDate: string
  amount: number
  concept: string
  sortOrder?: number
}

export interface UpdateFinanceSchedulePayload {
  kind?: string
  dueDate?: string
  amount?: number
  concept?: string
  sortOrder?: number
  status?: string
}

export interface CreateFinancePaymentPayload {
  paidAt: string
  amount: number
  concept: string
  paymentType?: string
  status: string
  scheduleItemId?: string | null
}

export interface UpdateFinancePaymentPayload {
  paidAt?: string
  amount?: number
  concept?: string
  paymentType?: string
  status?: string
  scheduleItemId?: string | null
}
