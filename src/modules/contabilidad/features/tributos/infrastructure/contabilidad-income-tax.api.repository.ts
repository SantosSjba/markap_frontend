import { apiClient } from '@core/api/apiClient'
import type { ContabilidadIncomeTaxSummaryDTO } from '../domain/income-tax.types'
import { CONTABILIDAD_INCOME_TAX_APP_SLUG } from '../domain/income-tax.types'

export async function fetchIncomeTaxSummary(periodId: string): Promise<ContabilidadIncomeTaxSummaryDTO> {
  const qs = `applicationSlug=${CONTABILIDAD_INCOME_TAX_APP_SLUG}&periodId=${encodeURIComponent(periodId)}`
  const { data } = await apiClient.get(`/contabilidad-extensions/income-tax-summary?${qs}`)
  return data
}
