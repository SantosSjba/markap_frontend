import type {
  BalanceSheetDTO,
  CashFlowStatementDTO,
  IncomeStatementDTO,
} from '../financial.types'

export interface ContabilidadFinancialRepository {
  getBalanceSheet(periodId: string, comparePrior?: boolean): Promise<BalanceSheetDTO>
  getIncomeStatement(periodId: string, comparePrior?: boolean): Promise<IncomeStatementDTO>
  getCashFlowStatement(periodId: string, comparePrior?: boolean): Promise<CashFlowStatementDTO>
}
