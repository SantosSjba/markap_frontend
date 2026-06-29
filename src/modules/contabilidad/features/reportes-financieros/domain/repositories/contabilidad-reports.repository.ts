import type {
  CashFlowTreasuryDTO,
  ContabilidadDashboardDTO,
  FinancialAnalysisDTO,
  TrialBalanceDTO,
} from '../reports.types'

export interface ContabilidadReportsRepository {
  getDashboard(periodId: string): Promise<ContabilidadDashboardDTO>
  getTrialBalance(periodId: string, costCenterId?: string): Promise<TrialBalanceDTO>
  getFinancialAnalysis(periodId: string): Promise<FinancialAnalysisDTO>
  getCashFlowTreasury(periodId: string): Promise<CashFlowTreasuryDTO>
}
