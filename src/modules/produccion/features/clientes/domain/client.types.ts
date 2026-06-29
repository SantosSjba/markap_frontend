export type ProduccionClientType = 'RESIDENTIAL' | 'CORPORATE'

export interface DocumentType {
  id: string
  code: string
  name: string
  length: number | null
}

export interface Department {
  id: string
  name: string
}

export interface Province {
  id: string
  name: string
  departmentId: string
}

export interface District {
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

export interface CreateProduccionClientPayload {
  applicationSlug?: string
  clientType: ProduccionClientType
  documentTypeId: string
  documentNumber: string
  fullName: string
  legalRepresentativeName?: string | null
  legalRepresentativePosition?: string | null
  primaryPhone: string
  secondaryPhone?: string | null
  primaryEmail: string
  secondaryEmail?: string | null
  notes?: string | null
  address?: {
    addressLine: string
    districtId: string
    reference?: string | null
  }
}

export interface ClientDetail {
  id: string
  applicationSlug: string
  clientType: ProduccionClientType
  documentTypeId: string
  documentNumber: string
  fullName: string
  legalRepresentativeName: string | null
  legalRepresentativePosition: string | null
  primaryPhone: string
  secondaryPhone: string | null
  primaryEmail: string
  secondaryEmail: string | null
  notes: string | null
  isActive: boolean
  documentType: DocumentType
  primaryAddress: {
    id: string
    addressLine: string
    reference: string | null
    districtId: string
    district: District
  } | null
}

export interface UpdateProduccionClientPayload {
  clientType?: ProduccionClientType
  documentTypeId?: string
  documentNumber?: string
  fullName?: string
  legalRepresentativeName?: string | null
  legalRepresentativePosition?: string | null
  primaryPhone?: string
  secondaryPhone?: string | null
  primaryEmail?: string
  secondaryEmail?: string | null
  notes?: string | null
  address?: {
    addressLine?: string
    districtId?: string
    reference?: string | null
  }
}

export interface ClientListItem {
  id: string
  fullName: string
  documentTypeCode: string
  documentNumber: string
  primaryPhone: string
  primaryEmail: string
  clientType: ProduccionClientType
  isActive: boolean
  propertiesCount: number
  contractsCount: number
}

export interface ClientStats {
  total: number
  owners: number
  tenants: number
  active: number
  residential?: number
  corporate?: number
}

export interface ListClientsParams {
  applicationSlug?: string
  page?: number
  limit?: number
  search?: string
  clientType?: ProduccionClientType
  isActive?: boolean
}

export interface ListClientsResponse {
  data: ClientListItem[]
  total: number
  page: number
  limit: number
}
