import { apiClient } from '@shared/infrastructure/http/api-client'
import { CONTABILIDAD_FINANCIAL_APP_SLUG } from '../../domain/financial.types'
import type { ContabilidadFinancialRepository } from '../../domain/repositories/contabilidad-financial.repository'
import type {
  FinancialExportKind,
  FinancialExportFormat,
} from '../../domain/financial-export.types'
function qs(periodId: string, comparePrior?: boolean) {
  const u = new URLSearchParams()
  u.set('applicationSlug', CONTABILIDAD_FINANCIAL_APP_SLUG)
  u.set('periodId', periodId)
  if (comparePrior === false) u.set('comparePrior', 'false')
  return u.toString()
}

function exportQs(
  format: FinancialExportFormat,
  type: FinancialExportKind,
  periodId: string,
  costCenterId?: string,
) {
  const u = new URLSearchParams()
  u.set('applicationSlug', CONTABILIDAD_FINANCIAL_APP_SLUG)
  u.set('periodId', periodId)
  u.set('type', type)
  if (costCenterId) u.set('costCenterId', costCenterId)
  return `/contabilidad-financial-statements/export/${format}?${u.toString()}`
}

export const contabilidadFinancialApiRepository: ContabilidadFinancialRepository = {
  getBalanceSheet: (periodId, comparePrior) =>
    apiClient
      .get(`/contabilidad-financial-statements/balance-sheet?${qs(periodId, comparePrior)}`)
      .then((r) => r.data),

  getIncomeStatement: (periodId, comparePrior) =>
    apiClient
      .get(`/contabilidad-financial-statements/income-statement?${qs(periodId, comparePrior)}`)
      .then((r) => r.data),

  getCashFlowStatement: (periodId, comparePrior) =>
    apiClient
      .get(`/contabilidad-financial-statements/cash-flow?${qs(periodId, comparePrior)}`)
      .then((r) => r.data),

  downloadExport(
    format: FinancialExportFormat,
    type: FinancialExportKind,
    periodId: string,
    costCenterId?: string,
  ) {
    return apiClient.get<Blob>(exportQs(format, type, periodId, costCenterId), {
      responseType: 'blob',
    })
  },
}
