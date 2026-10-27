import type {
  FinancingChannelCategory,
  VentasConfigBootstrap,
  VentasFinancingChannel,
  VentasPipelineStageDTO,
} from '../config.types'
export interface VentasConfigRepository {
  bootstrap: () => Promise<VentasConfigBootstrap>
  replacePipelineStages: (stages: VentasPipelineStageDTO[]) => Promise<VentasPipelineStageDTO[]>
  listFinancingChannels: () => Promise<VentasFinancingChannel[]>
  createFinancingChannel: (body: { category: FinancingChannelCategory; name: string }) => Promise<VentasFinancingChannel>
  updateFinancingChannel: (
    id: string,
    body: { category?: FinancingChannelCategory; name?: string; isActive?: boolean },
  ) => Promise<VentasFinancingChannel>
}
