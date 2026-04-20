import type { VentasConfigBootstrap, VentasPipelineStageDTO } from '../config.types'

export interface VentasConfigRepository {
  bootstrap: () => Promise<VentasConfigBootstrap>
  replacePipelineStages: (stages: VentasPipelineStageDTO[]) => Promise<VentasPipelineStageDTO[]>
  patchSaleProcessNumbering: (body: { prefix?: string; lastNumber?: number }) => Promise<VentasConfigBootstrap['numbering']>
}
