import type {
  ContabilidadIncomeTaxDetailDTO,
  ContabilidadIncomeTaxExportDTO,
  ContabilidadIncomeTaxSummaryDTO,
  UpsertContabilidadIncomeTaxPeriodBody,
} from '../income-tax.types'
export interface IncomeTaxRepository {
  summary(periodId: string): Promise<ContabilidadIncomeTaxSummaryDTO>
  detail(periodId: string): Promise<ContabilidadIncomeTaxDetailDTO>
  save(
    periodId: string,
    body: UpsertContabilidadIncomeTaxPeriodBody,
  ): Promise<ContabilidadIncomeTaxDetailDTO>
  export(periodId: string): Promise<ContabilidadIncomeTaxExportDTO>
}
