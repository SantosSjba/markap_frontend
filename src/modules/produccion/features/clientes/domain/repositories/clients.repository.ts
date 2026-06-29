import type {
  ClientDetail,
  ClientStats,
  CreateProduccionClientPayload,
  Department,
  District,
  DocumentType,
  ListClientsParams,
  ListClientsResponse,
  Province,
  UpdateProduccionClientPayload,
} from '../client.types'

export interface ProduccionClientsRepository {
  getDocumentTypes: () => Promise<DocumentType[]>
  getDepartments: () => Promise<Department[]>
  getProvinces: (departmentId?: string) => Promise<Province[]>
  getDistricts: (provinceId?: string) => Promise<District[]>
  getList: (params: ListClientsParams) => Promise<ListClientsResponse>
  getStats: (applicationSlug?: string) => Promise<ClientStats>
  create: (data: CreateProduccionClientPayload) => Promise<{ id: string } & Record<string, unknown>>
  getById: (id: string) => Promise<ClientDetail>
  update: (id: string, data: UpdateProduccionClientPayload) => Promise<unknown>
  delete: (id: string) => Promise<{ message: string }>
}
