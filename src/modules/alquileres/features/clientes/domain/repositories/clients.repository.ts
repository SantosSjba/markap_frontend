import type {
  ClientDetail,
  ClientStats,
  CreateClientPayload,
  District,
  DocumentType,
  Department,
  ListClientsParams,
  ListClientsResponse,
  Province,
  UpdateClientPayload,
} from '../client.types'

export interface ClientsRepository {
  getDocumentTypes: () => Promise<DocumentType[]>
  getDepartments: () => Promise<Department[]>
  getProvinces: (departmentId?: string) => Promise<Province[]>
  getDistricts: (provinceId?: string) => Promise<District[]>
  getList: (params: ListClientsParams) => Promise<ListClientsResponse>
  getStats: (applicationSlug?: string) => Promise<ClientStats>
  create: (data: CreateClientPayload) => Promise<{ id: string } & Record<string, unknown>>
  getById: (id: string) => Promise<ClientDetail>
  update: (id: string, data: UpdateClientPayload) => Promise<unknown>
  delete: (id: string) => Promise<{ message: string }>
}
