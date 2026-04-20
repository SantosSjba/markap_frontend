import { apiClient } from '@core/api/apiClient'
import {
  ALQUILERES_REPORTS_SLUG,
  type ActiveClientReportItem,
  type ContractExpiringItem,
  type ContractStatusSummary,
  type FinancialDistributionReportItem,
  type MonthlyMetrics,
  type PropertyWithoutContractItem,
  type RentalsByMonthItem,
  type ReportsSummary,
} from '../../domain/reportes.types'
import type { ReportesRepository } from '../../domain/repositories/reportes.repository'

export const reportesApiRepository: ReportesRepository = {
  getSummary(applicationSlug: string = ALQUILERES_REPORTS_SLUG, days: number = 30) {
    return apiClient
      .get<ReportsSummary>('/reports/summary', { params: { applicationSlug, days } })
      .then((r) => r.data)
  },

  getContractsExpiring(applicationSlug: string = ALQUILERES_REPORTS_SLUG, days: number = 30) {
    return apiClient
      .get<ContractExpiringItem[]>('/reports/contracts-expiring', {
        params: { applicationSlug, days },
      })
      .then((r) => r.data)
  },

  getPropertiesWithoutContract(applicationSlug: string = ALQUILERES_REPORTS_SLUG) {
    return apiClient
      .get<PropertyWithoutContractItem[]>('/reports/properties-without-contract', {
        params: { applicationSlug },
      })
      .then((r) => r.data)
  },

  getActiveClients(applicationSlug: string = ALQUILERES_REPORTS_SLUG) {
    return apiClient
      .get<ActiveClientReportItem[]>('/reports/active-clients', {
        params: { applicationSlug },
      })
      .then((r) => r.data)
  },

  getContractStatusSummary(applicationSlug: string = ALQUILERES_REPORTS_SLUG) {
    return apiClient
      .get<ContractStatusSummary>('/reports/contract-status-summary', {
        params: { applicationSlug },
      })
      .then((r) => r.data)
  },

  getMonthlyMetrics(applicationSlug: string = ALQUILERES_REPORTS_SLUG) {
    return apiClient
      .get<MonthlyMetrics>('/reports/monthly-metrics', {
        params: { applicationSlug },
      })
      .then((r) => r.data)
  },

  getRentalsByMonth(
    applicationSlug: string = ALQUILERES_REPORTS_SLUG,
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
    applicationSlug: string = ALQUILERES_REPORTS_SLUG,
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
