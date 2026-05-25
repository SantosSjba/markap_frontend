/** Dominio — clientes CRM Ventas (independiente de Alquileres). */

export const VENTAS_CLIENTS_APPLICATION_SLUG = 'ventas' as const

export interface VentasDocumentType {
  id: string
  code: string
  name: string
  length: number | null
}

export interface VentasDepartment {
  id: string
  name: string
}

export interface VentasProvince {
  id: string
  name: string
  departmentId: string
}

export interface VentasDistrict {
  id: string
  name: string
  provinceId: string
  province: {
    id: string
    name: string
    department: {
      id: string
      name: string
    }
  }
}

export type SalesPipelineStatus = 'PROSPECT' | 'INTERESTED' | 'CLIENT'

export type VentasClientType = 'BUYER' | 'OWNER'

export interface VentasClientListItem {
  id: string
  fullName: string
  documentTypeCode: string
  documentNumber: string
  primaryPhone: string
  primaryEmail: string | null
  clientType: VentasClientType
  isActive: boolean
  propertiesCount: number
  contractsCount: number
  salesStatus: SalesPipelineStatus | null
  leadOrigin: string | null
  assignedAgentName: string | null
}

export interface VentasClientDetail {
  id: string
  applicationSlug: string
  clientType: VentasClientType
  documentTypeId: string
  documentNumber: string
  fullName: string
  legalRepresentativeName: string | null
  legalRepresentativePosition: string | null
  primaryPhone: string
  secondaryPhone: string | null
  primaryEmail: string | null
  secondaryEmail: string | null
  notes: string | null
  isActive: boolean
  salesStatus: SalesPipelineStatus | null
  leadOrigin: string | null
  assignedAgentId: string | null
  documentType: VentasDocumentType
  primaryAddress: {
    id: string
    addressLine: string
    reference: string | null
    districtId: string
    locationCustom?: {
      country: string
      department: string
      province: string
      district: string
    } | null
    district: VentasDistrict
  } | null
  assignedAgent: { id: string; fullName: string } | null
}

export interface CreateVentasClientPayload {
  clientType: VentasClientType
  documentTypeId: string
  documentNumber: string
  fullName: string
  legalRepresentativeName?: string | null
  legalRepresentativePosition?: string | null
  primaryPhone: string
  secondaryPhone?: string | null
  primaryEmail?: string | null
  secondaryEmail?: string | null
  notes?: string | null
  salesStatus?: SalesPipelineStatus
  leadOrigin?: string | null
  assignedAgentId?: string | null
  address?: {
    addressLine: string
    districtId: string
    reference?: string | null
    locationCustom?: {
      country: string
      department: string
      province: string
      district: string
    } | null
  }
}

export interface UpdateVentasClientPayload {
  clientType?: VentasClientType
  documentTypeId?: string
  documentNumber?: string
  fullName?: string
  legalRepresentativeName?: string | null
  legalRepresentativePosition?: string | null
  primaryPhone?: string
  secondaryPhone?: string | null
  primaryEmail?: string | null
  secondaryEmail?: string | null
  notes?: string | null
  salesStatus?: SalesPipelineStatus | null
  leadOrigin?: string | null
  assignedAgentId?: string | null
  address?: {
    addressLine?: string
    districtId?: string
    reference?: string | null
    locationCustom?: {
      country: string
      department: string
      province: string
      district: string
    } | null
  }
}

export interface ListVentasClientsParams {
  page?: number
  limit?: number
  search?: string
  clientType?: VentasClientType
  salesStatus?: SalesPipelineStatus
  isActive?: boolean
}

export interface ListVentasClientsResponse {
  data: VentasClientListItem[]
  total: number
  page: number
  limit: number
}

export interface VentasClientStats {
  total: number
  owners: number
  tenants: number
  active: number
  prospects?: number
  interested?: number
  salesClients?: number
}
