import { apiClient } from '@core/api/apiClient'
import { CONTABILIDAD_FINANCIAL_APP_SLUG } from '../../domain/financial.types'
import type { ContabilidadFinancialRepository } from '../../domain/repositories/contabilidad-financial.repository'

function qs(periodId: string, comparePrior?: boolean) {
  const u = new URLSearchParams()
  u.set('applicationSlug', CONTABILIDAD_FINANCIAL_APP_SLUG)
  u.set('periodId', periodId)
  if (comparePrior === false) u.set('comparePrior', 'false')
  return u.toString()
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
}
