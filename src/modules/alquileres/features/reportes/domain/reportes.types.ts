export const ALQUILERES_REPORTS_SLUG = 'alquileres' as const

export interface ReportsSummary {
  contratosPorVencer: number
  propiedadesSinContrato: number
  clientesActivos: number
  clientesConIncidencias: number
}

export interface ContractExpiringItem {
  id: string
  code: string
  tenantName: string
  propertyAddress: string
  ownerName: string
  endDate: string
  daysLeft: number
}

export interface PropertyWithoutContractItem {
  id: string
  code: string
  addressLine: string
  ownerName: string
}

export interface ActiveClientReportItem {
  id: string
  fullName: string
  contractsCount: number
}

export interface ContractStatusSummary {
  vigentes: number
  porVencer: number
  proximos: number
  urgentes: number
}

export interface MonthlyMetrics {
  tasaOcupacion: number
  tasaCobranza: number
  contratosRenovados: number
  clientesNuevos: number
}

export interface RentalsByMonthItem {
  month: number
  year: number
  monthName: string
  newContracts: number
  expiredContracts: number
  activeAtEndOfMonth: number
  totalRevenue: number
  companyRevenue: number
  totalExpense: number
  totalTax: number
  totalExternalCommission: number
  totalInternalCommission: number
  totalUtility: number
  currency: string
}

export interface FinancialDistributionReportItem {
  rentalId: string
  rentalCode: string
  propertyAddress: string
  ownerName: string
  tenantName: string
  currency: string
  baseAmount: number
  monthlyAmount: number
  expense: number
  tax: number
  externalAgentCommission: number
  internalAgentCommission: number
  utility: number
  externalAgentName: string | null
  internalAgentName: string | null
  status: string
}

export interface RentalsByMonthParams {
  year?: number
  month?: number
  startDate?: string
  endDate?: string
}

export interface FinancialDistributionParams {
  status?: string
  startDate?: string
  endDate?: string
}
