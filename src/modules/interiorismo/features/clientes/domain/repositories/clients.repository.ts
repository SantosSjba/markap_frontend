import type {
  ClientDetail,
  ClientStats,
  CreateInteriorClientPayload,
  Department,
  District,
  DocumentType,
  ListClientsParams,
  ListClientsResponse,
  Province,
  UpdateInteriorClientPayload,
} from '../client.types'

export interface InteriorClientsRepository {
  getDocumentTypes: () => Promise<DocumentType[]>
  getDepartments: () => Promise<Department[]>
  getProvinces: (departmentId?: string) => Promise<Province[]>
  getDistricts: (provinceId?: string) => Promise<District[]>
  getList: (params: ListClientsParams) => Promise<ListClientsResponse>
  getStats: (applicationSlug?: string) => Promise<ClientStats>
  create: (data: CreateInteriorClientPayload) => Promise<{ id: string } & Record<string, unknown>>
  getById: (id: string) => Promise<ClientDetail>
  update: (id: string, data: UpdateInteriorClientPayload) => Promise<unknown>
  delete: (id: string) => Promise<{ message: string }>
}
