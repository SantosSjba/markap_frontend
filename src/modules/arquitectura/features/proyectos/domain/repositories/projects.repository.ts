import type {
  CreateArquitecturaProjectPayload,
  ArquitecturaProjectDetail,
  ListArquitecturaProjectsParams,
  ListArquitecturaProjectsResponse,
  UpdateArquitecturaProjectPayload,
} from '../project.types'

export interface ArquitecturaProjectsRepository {
  getList: (params: ListArquitecturaProjectsParams) => Promise<ListArquitecturaProjectsResponse>
  getById: (id: string) => Promise<ArquitecturaProjectDetail>
  create: (payload: CreateArquitecturaProjectPayload) => Promise<ArquitecturaProjectDetail>
  update: (id: string, payload: UpdateArquitecturaProjectPayload) => Promise<ArquitecturaProjectDetail>
}
