import { apiClient } from '@core/api'

export interface DocumentType {
  id: string
  code: string
  name: string
  length: number | null
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

export interface CreateClientPayload {
  applicationSlug?: string
  clientType: 'OWNER' | 'TENANT'
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
  address: {
    addressLine: string
    districtId: string
    reference?: string | null
  }
}

export const clientsService = {
  getDocumentTypes: () =>
    apiClient.get<DocumentType[]>('/clients/document-types').then((r) => r.data),

  getDistricts: (provinceId?: string) => {
    const params = provinceId ? { provinceId } : {}
    return apiClient
      .get<District[]>('/clients/districts', { params })
      .then((r) => r.data)
  },

  create: (data: CreateClientPayload) =>
    apiClient.post('/clients', { ...data, applicationSlug: 'alquileres' }).then((r) => r.data),
}
