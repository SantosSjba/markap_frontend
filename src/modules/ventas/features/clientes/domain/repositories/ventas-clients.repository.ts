import type {
  CreateVentasClientPayload,
  ListVentasClientsParams,
  ListVentasClientsResponse,
  UpdateVentasClientPayload,
  VentasClientDetail,
  VentasClientStats,
  VentasDepartment,
  VentasDistrict,
  VentasDocumentType,
  VentasProvince,
} from '../client.types'

export interface VentasClientsRepository {
  getDocumentTypes: () => Promise<VentasDocumentType[]>
  getDepartments: () => Promise<VentasDepartment[]>
  getProvinces: (departmentId?: string) => Promise<VentasProvince[]>
  getDistricts: (provinceId?: string) => Promise<VentasDistrict[]>
  getList: (params: ListVentasClientsParams) => Promise<ListVentasClientsResponse>
  getStats: () => Promise<VentasClientStats>
  create: (data: CreateVentasClientPayload) => Promise<VentasClientDetail>
  getById: (id: string) => Promise<VentasClientDetail>
  update: (id: string, data: UpdateVentasClientPayload) => Promise<unknown>
  delete: (id: string) => Promise<{ message: string }>
}
