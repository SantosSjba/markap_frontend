import { apiClient } from '@app/api/apiClient'

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
  /** Suma de monthlyAmount del contrato */
  totalRevenue: number
  /** Monto real que recibe la empresa: baseAmount de config si existe, sino monthlyAmount */
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

const APPLICATION_SLUG = 'alquileres'

export const reportesService = {
  getSummary(applicationSlug: string = APPLICATION_SLUG, days: number = 30) {
    return apiClient
      .get<ReportsSummary>('/reports/summary', { params: { applicationSlug, days } })
      .then((r) => r.data)
  },

  getContractsExpiring(applicationSlug: string = APPLICATION_SLUG, days: number = 30) {
    return apiClient
      .get<ContractExpiringItem[]>('/reports/contracts-expiring', {
        params: { applicationSlug, days },
      })
      .then((r) => r.data)
  },

  getPropertiesWithoutContract(applicationSlug: string = APPLICATION_SLUG) {
    return apiClient
      .get<PropertyWithoutContractItem[]>('/reports/properties-without-contract', {
        params: { applicationSlug },
      })
      .then((r) => r.data)
  },

  getActiveClients(applicationSlug: string = APPLICATION_SLUG) {
    return apiClient
      .get<ActiveClientReportItem[]>('/reports/active-clients', {
        params: { applicationSlug },
      })
      .then((r) => r.data)
  },

  getContractStatusSummary(applicationSlug: string = APPLICATION_SLUG) {
    return apiClient
      .get<ContractStatusSummary>('/reports/contract-status-summary', {
        params: { applicationSlug },
      })
      .then((r) => r.data)
  },

  getMonthlyMetrics(applicationSlug: string = APPLICATION_SLUG) {
    return apiClient
      .get<MonthlyMetrics>('/reports/monthly-metrics', {
        params: { applicationSlug },
      })
      .then((r) => r.data)
  },

  getRentalsByMonth(
    applicationSlug: string = APPLICATION_SLUG,
    year: number = new Date().getFullYear(),
    month?: number,
    startDate?: string,
    endDate?: string,
  ) {
    return apiClient
      .get<RentalsByMonthItem[]>('/reports/rentals-by-month', {
        params: {
          applicationSlug,
          year,
          ...(month != null ? { month } : {}),
          ...(startDate ? { startDate } : {}),
          ...(endDate ? { endDate } : {}),
        },
      })
      .then((r) => r.data)
  },

  getFinancialDistribution(
    applicationSlug: string = APPLICATION_SLUG,
    status?: string,
    startDate?: string,
    endDate?: string,
  ) {
    return apiClient
      .get<FinancialDistributionReportItem[]>('/reports/financial-distribution', {
        params: {
          applicationSlug,
          ...(status ? { status } : {}),
          ...(startDate ? { startDate } : {}),
          ...(endDate ? { endDate } : {}),
        },
      })
      .then((r) => r.data)
  },
}
