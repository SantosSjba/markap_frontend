import type {
  ClientDetail,
  ClientStats,
  CreateArquitecturaClientPayload,
  Department,
  District,
  DocumentType,
  ListClientsParams,
  ListClientsResponse,
  Province,
  UpdateArquitecturaClientPayload,
} from '../client.types'

export interface ArquitecturaClientsRepository {
  getDocumentTypes: () => Promise<DocumentType[]>
  getDepartments: () => Promise<Department[]>
  getProvinces: (departmentId?: string) => Promise<Province[]>
  getDistricts: (provinceId?: string) => Promise<District[]>
  getList: (params: ListClientsParams) => Promise<ListClientsResponse>
  getStats: (applicationSlug?: string) => Promise<ClientStats>
  create: (data: CreateArquitecturaClientPayload) => Promise<{ id: string } & Record<string, unknown>>
  getById: (id: string) => Promise<ClientDetail>
  update: (id: string, data: UpdateArquitecturaClientPayload) => Promise<unknown>
  delete: (id: string) => Promise<{ message: string }>
}
