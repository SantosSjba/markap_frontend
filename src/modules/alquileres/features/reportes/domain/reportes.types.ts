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
  startDate: string
  endDate: string
  daysLeft: number
  currency: string
  monthlyAmount: number
}

export interface PropertyWithoutContractItem {
  id: string
  code: string
  addressLine: string
  ownerName: string
  propertyType: string
  district: string | null
  /** Renta de referencia de la propiedad */
  monthlyRent: number | null
  rentCurrency: string
  listingStatus: string | null
  /** Fin del último contrato; null si nunca tuvo uno */
  lastContractEndDate: string | null
}

/** Contrato vigente de un cliente activo */
export interface ActiveClientContract {
  rentalId: string
  code: string
  propertyAddress: string
  ownerName: string
  startDate: string
  endDate: string
  daysLeft: number
  currency: string
  monthlyAmount: number
  /** false = co-inquilino */
  isPrimaryTenant: boolean
}

export interface ActiveClientReportItem {
  id: string
  fullName: string
  contractsCount: number
  documentNumber: string | null
  phone: string | null
  email: string | null
  contracts: ActiveClientContract[]
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

/** Comisiones cobradas en el mes, en una sola moneda (soles y dólares no se suman). */
export interface RentalsByMonthCurrencyTotals {
  currency: string
  /** Comisiones cobradas en el período cuyo contrato está en esta moneda */
  collectedCommissions: number
  /** Renta mensual de esos contratos */
  totalRevenue: number
  /** Ingreso de la distribución financiera (comisión de la inmobiliaria) */
  companyRevenue: number
  totalExpense: number
  totalTax: number
  totalExternalCommission: number
  totalInternalCommission: number
  totalUtility: number
}

export interface RentalsByMonthItem {
  month: number
  year: number
  monthName: string
  newContracts: number
  expiredContracts: number
  activeAtEndOfMonth: number
  /** Según la fecha efectiva de cobro de cada comisión */
  totalsByCurrency: RentalsByMonthCurrencyTotals[]
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
  contractStartDate?: string
  commissionStatus: 'PENDING' | 'PAID'
  commissionPaidDate: string | null
  /** Montos fijos en otra moneda (p. ej. agente en S/ de un contrato en US$); cuentan en su moneda */
  otherCurrencyTotals: FinancialCurrencyLineTotals[]
}

export interface FinancialCurrencyLineTotals {
  currency: string
  income: number
  expense: number
  tax: number
  externalAgentCommission: number
  internalAgentCommission: number
  utility: number
}

export interface RentalsByMonthParams {
  year?: number
  month?: number
  startDate?: string
  endDate?: string
}

/** Fecha que filtra el rango: inicio del contrato o cobro de la comisión */
export type FinancialDistributionDateField = 'startDate' | 'commissionPaidDate'

export interface FinancialDistributionParams {
  status?: string
  startDate?: string
  endDate?: string
  dateField?: FinancialDistributionDateField
}
