import type { BalanceSheetDTO, CashFlowStatementDTO, IncomeStatementDTO } from '../financial.types'
import type { FinancialExportFormat } from '../financial-export.types'
import type { FinancialExportKind } from '../financial-export.types'
export interface ContabilidadFinancialRepository {
  getBalanceSheet(periodId: string, comparePrior?: boolean): Promise<BalanceSheetDTO>
  getIncomeStatement(periodId: string, comparePrior?: boolean): Promise<IncomeStatementDTO>
  getCashFlowStatement(periodId: string, comparePrior?: boolean): Promise<CashFlowStatementDTO>
  downloadExport(
    format: FinancialExportFormat,
    type: FinancialExportKind,
    periodId: string,
    costCenterId?: string,
  ): Promise<{ data: Blob; headers: Record<string, unknown> }>
}
