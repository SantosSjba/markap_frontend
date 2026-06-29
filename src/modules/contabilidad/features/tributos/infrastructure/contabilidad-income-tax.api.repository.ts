import { apiClient } from '@core/api/apiClient'
import type {
  ContabilidadIncomeTaxDetailDTO,
  ContabilidadIncomeTaxExportDTO,
  ContabilidadIncomeTaxSummaryDTO,
  UpsertContabilidadIncomeTaxPeriodBody,
} from '../domain/income-tax.types'
import { CONTABILIDAD_INCOME_TAX_APP_SLUG } from '../domain/income-tax.types'

function incomeTaxQs(periodId: string) {
  return `applicationSlug=${CONTABILIDAD_INCOME_TAX_APP_SLUG}&periodId=${encodeURIComponent(periodId)}`
}

export async function fetchIncomeTaxSummary(periodId: string): Promise<ContabilidadIncomeTaxSummaryDTO> {
  const { data } = await apiClient.get(`/contabilidad-extensions/income-tax-summary?${incomeTaxQs(periodId)}`)
  return data
}

export async function fetchIncomeTaxDetail(periodId: string): Promise<ContabilidadIncomeTaxDetailDTO> {
  const { data } = await apiClient.get(`/contabilidad-extensions/income-tax-detail?${incomeTaxQs(periodId)}`)
  return data
}

export async function upsertIncomeTaxPeriod(
  periodId: string,
  body: UpsertContabilidadIncomeTaxPeriodBody,
): Promise<ContabilidadIncomeTaxDetailDTO> {
  const { data } = await apiClient.put(
    `/contabilidad-extensions/income-tax-period?${incomeTaxQs(periodId)}`,
    body,
  )
  return data
}

export async function fetchIncomeTaxExport(periodId: string): Promise<ContabilidadIncomeTaxExportDTO> {
  const { data } = await apiClient.get(`/contabilidad-extensions/income-tax-export?${incomeTaxQs(periodId)}`)
  return data
}
