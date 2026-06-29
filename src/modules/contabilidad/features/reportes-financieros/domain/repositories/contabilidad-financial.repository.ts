import type {
  BalanceSheetDTO,
  CashFlowStatementDTO,
  FinancialStatementExportDTO,
  IncomeStatementDTO,
} from '../financial.types'

export interface ContabilidadFinancialRepository {
  getBalanceSheet(periodId: string, comparePrior?: boolean): Promise<BalanceSheetDTO>
  getIncomeStatement(periodId: string, comparePrior?: boolean): Promise<IncomeStatementDTO>
  getCashFlowStatement(periodId: string, comparePrior?: boolean): Promise<CashFlowStatementDTO>
  exportBalanceSheet(periodId: string): Promise<FinancialStatementExportDTO>
  exportIncomeStatement(periodId: string): Promise<FinancialStatementExportDTO>
  exportCashFlowStatement(periodId: string): Promise<FinancialStatementExportDTO>
}
