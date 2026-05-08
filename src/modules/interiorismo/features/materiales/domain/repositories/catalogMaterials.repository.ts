import type {
  CreateInteriorCatalogMaterialPayload,
  InteriorCatalogMaterialDetail,
  ListInteriorCatalogMaterialsParams,
  ListInteriorCatalogMaterialsResponse,
  UpdateInteriorCatalogMaterialPayload,
} from '../catalog.types'

export interface InteriorCatalogMaterialsRepository {
  getList(params: ListInteriorCatalogMaterialsParams): Promise<ListInteriorCatalogMaterialsResponse>
  getById(id: string): Promise<InteriorCatalogMaterialDetail>
  create(payload: CreateInteriorCatalogMaterialPayload): Promise<InteriorCatalogMaterialDetail>
  update(id: string, payload: UpdateInteriorCatalogMaterialPayload): Promise<InteriorCatalogMaterialDetail>
  delete(id: string): Promise<void>
}
