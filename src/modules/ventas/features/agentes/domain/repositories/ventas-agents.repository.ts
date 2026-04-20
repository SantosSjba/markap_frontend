import type {
  CreateVentasAgentPayload,
  ListVentasAgentsParams,
  ListVentasAgentsResult,
  UpdateVentasAgentPayload,
  VentasAgentListItem,
} from '../agent.types'

export interface VentasAgentsRepository {
  list(params: ListVentasAgentsParams): Promise<ListVentasAgentsResult>
  getById(id: string): Promise<VentasAgentListItem>
  create(payload: CreateVentasAgentPayload): Promise<VentasAgentListItem>
  update(id: string, payload: UpdateVentasAgentPayload): Promise<VentasAgentListItem>
  delete(id: string): Promise<{ message: string }>
}
