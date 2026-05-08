export interface InteriorFinanceBudgetRefDto {
  id: string
  code: string
  version: number
  grandTotal: number
  taxableTotal: number
  igvTotal: number
  status: string
}

export interface InteriorFinanceScheduleDto {
  id: string
  kind: string
  dueDate: string
  amount: number
  concept: string
  sortOrder: number
  status: string
  paidTowardSchedule: number
}

export interface InteriorFinancePaymentDto {
  id: string
  paidAt: string
  amount: number
  concept: string
  status: string
  scheduleItemId: string | null
}

export interface InteriorFinanceExpenseLineDto {
  id: string
  costCategory: string
  concept: string
  amount: number
  occurredAt: string
}

export interface InteriorFinanceIncomeSummaryDto {
  scheduledTotal: number
  advancesScheduled: number
  installmentsScheduled: number
  collectedConfirmed: number
  pendingFromClient: number
}

export interface InteriorFinanceExpenseSummaryDto {
  purchases: number
  labor: number
  transport: number
  otherExpenses: number
  totalOut: number
}

export interface InteriorFinanceProfitabilityDto {
  contractValue: number
  totalScheduled: number
  totalCollected: number
  totalActualCosts: number
  budgetVsCosts: number
  collectedVsCosts: number
  marginOnCollectedPct: number | null
}

export interface InteriorFinanceCashFlowMonthDto {
  month: string
  inflow: number
  outflow: number
  net: number
}

export interface InteriorFinanceMovementDto {
  occurredAt: string
  direction: 'IN' | 'OUT'
  concept: string
  amount: number
  refKind: 'PAYMENT' | 'COST'
}

export interface InteriorFinanceOverviewDto {
  projectId: string
  projectCode: string
  projectName: string
  budgetReference: InteriorFinanceBudgetRefDto | null
  schedules: InteriorFinanceScheduleDto[]
  payments: InteriorFinancePaymentDto[]
  expenseLines: InteriorFinanceExpenseLineDto[]
  incomeSummary: InteriorFinanceIncomeSummaryDto
  expenseSummary: InteriorFinanceExpenseSummaryDto
  profitability: InteriorFinanceProfitabilityDto
  cashFlowByMonth: InteriorFinanceCashFlowMonthDto[]
  recentMovements: InteriorFinanceMovementDto[]
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
  status: string
  scheduleItemId?: string | null
}

export interface UpdateFinancePaymentPayload {
  paidAt?: string
  amount?: number
  concept?: string
  status?: string
  scheduleItemId?: string | null
}
