import type {
  ContabilidadCpeEmitResultDTO,
  ContabilidadCpeProviderConfigResponse,
  UpsertCpeProviderConfigBody,
} from '../cpe.types'

export interface ContabilidadCpeRepository {
  getProviderConfig(): Promise<ContabilidadCpeProviderConfigResponse>
  saveProviderConfig(body: UpsertCpeProviderConfigBody): Promise<ContabilidadCpeProviderConfigResponse>
  emitSalesInvoice(invoiceId: string): Promise<ContabilidadCpeEmitResultDTO>
  downloadArtifact(logId: string, kind: 'xml' | 'cdr'): Promise<void>
}
