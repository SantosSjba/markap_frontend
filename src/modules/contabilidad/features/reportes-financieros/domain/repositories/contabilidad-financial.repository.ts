import type {
  BalanceSheetDTO,
  CashFlowStatementDTO,
  IncomeStatementDTO,
} from '../financial.types'
import type {
  FinancialExportFormat,
  FinancialExportKind,
} from '../../infrastructure/repositories/contabilidad-financial.api.repository'

export interface ContabilidadFinancialRepository {
  getBalanceSheet(periodId: string, comparePrior?: boolean): Promise<BalanceSheetDTO>
  getIncomeStatement(periodId: string, comparePrior?: boolean): Promise<IncomeStatementDTO>
  getCashFlowStatement(periodId: string, comparePrior?: boolean): Promise<CashFlowStatementDTO>
  downloadExport(
    format: FinancialExportFormat,
    type: FinancialExportKind,
    periodId: string,
    costCenterId?: string,
  ): Promise<import('axios').AxiosResponse<Blob>>
}
