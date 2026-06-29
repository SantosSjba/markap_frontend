import type {
  CreateProduccionFurniturePayload,
  ListProduccionFurnitureParams,
  ListProduccionFurnitureResponse,
  ProduccionFurnitureDetail,
  ProduccionFurnitureStats,
  UpdateProduccionFurniturePayload,
} from '../catalog.types'

export interface ProduccionCatalogRepository {
  getList(params?: ListProduccionFurnitureParams): Promise<ListProduccionFurnitureResponse>
  getStats(): Promise<ProduccionFurnitureStats>
  getById(id: string): Promise<ProduccionFurnitureDetail>
  create(payload: CreateProduccionFurniturePayload): Promise<ProduccionFurnitureDetail>
  update(id: string, payload: UpdateProduccionFurniturePayload): Promise<ProduccionFurnitureDetail>
  delete(id: string): Promise<void>
}
