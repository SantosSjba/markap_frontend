import type {
  ContabilidadDetraccionDTO,
  ContabilidadDetraccionRateDTO,
  ContabilidadPerceptionDTO,
  ContabilidadPdt621ExportDTO,
  ContabilidadRetentionDTO,
  ContabilidadTaxDashboardDTO,
  CreateDetraccionBody,
  CreatePerceptionBody,
  CreateRetentionBody,
  PayDetraccionBody,
} from '../taxes.types'

export interface ContabilidadTaxesRepository {
  getDashboard(periodId?: string): Promise<ContabilidadTaxDashboardDTO>
  exportPdt621(periodId: string): Promise<ContabilidadPdt621ExportDTO>

  listDetraccionRates(): Promise<{ rates: ContabilidadDetraccionRateDTO[] }>
  listDetracciones(params?: { periodId?: string; status?: string }): Promise<{
    detracciones: ContabilidadDetraccionDTO[]
    statusLabels: Record<string, string>
  }>
  createDetraccion(body: CreateDetraccionBody): Promise<ContabilidadDetraccionDTO>
  payDetraccion(id: string, body: PayDetraccionBody): Promise<ContabilidadDetraccionDTO>

  listRetentions(params?: { periodId?: string; retentionType?: string }): Promise<{
    retentions: ContabilidadRetentionDTO[]
    retentionTypeLabels: Record<string, string>
    defaultRates: { IGV: number; RENTA: number }
  }>
  createRetention(body: CreateRetentionBody): Promise<ContabilidadRetentionDTO>

  listPerceptions(params?: { periodId?: string }): Promise<{
    perceptions: ContabilidadPerceptionDTO[]
    perceptionTypeLabels: Record<string, string>
    defaultRate: number
  }>
  createPerception(body: CreatePerceptionBody): Promise<ContabilidadPerceptionDTO>
}
