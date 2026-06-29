import { apiClient } from '@core/api/apiClient'
import { CONTABILIDAD_REPORTS_APP_SLUG } from '../../domain/reports.types'
import type { ContabilidadReportsRepository } from '../../domain/repositories/contabilidad-reports.repository'

function qs(periodId: string, extra?: Record<string, string | undefined>) {
  const u = new URLSearchParams()
  u.set('applicationSlug', CONTABILIDAD_REPORTS_APP_SLUG)
  u.set('periodId', periodId)
  if (extra) {
    Object.entries(extra).forEach(([k, v]) => {
      if (v) u.set(k, v)
    })
  }
  return u.toString()
}

export const contabilidadReportsApiRepository: ContabilidadReportsRepository = {
  getDashboard: (periodId) =>
    apiClient.get(`/contabilidad-reports/dashboard?${qs(periodId)}`).then((r) => r.data),

  getTrialBalance: (periodId, costCenterId) =>
    apiClient
      .get(`/contabilidad-reports/trial-balance?${qs(periodId, { costCenterId })}`)
      .then((r) => r.data),

  getFinancialAnalysis: (periodId) =>
    apiClient.get(`/contabilidad-reports/financial-analysis?${qs(periodId)}`).then((r) => r.data),

  getCashFlowTreasury: (periodId) =>
    apiClient.get(`/contabilidad-reports/cash-flow-treasury?${qs(periodId)}`).then((r) => r.data),
}
