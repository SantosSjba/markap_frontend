import type {
  CreateArquitecturaCatalogMaterialPayload,
  ArquitecturaCatalogMaterialDetail,
  ListArquitecturaCatalogMaterialsParams,
  ListArquitecturaCatalogMaterialsResponse,
  UpdateArquitecturaCatalogMaterialPayload,
} from '../catalog.types'

export interface ArquitecturaCatalogMaterialsRepository {
  getList(params: ListArquitecturaCatalogMaterialsParams): Promise<ListArquitecturaCatalogMaterialsResponse>
  getById(id: string): Promise<ArquitecturaCatalogMaterialDetail>
  create(payload: CreateArquitecturaCatalogMaterialPayload): Promise<ArquitecturaCatalogMaterialDetail>
  update(id: string, payload: UpdateArquitecturaCatalogMaterialPayload): Promise<ArquitecturaCatalogMaterialDetail>
  delete(id: string): Promise<void>
}
