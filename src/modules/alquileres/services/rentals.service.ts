import { apiClient } from '@core/api'

export interface CreateRentalPayload {
  applicationSlug?: string
  propertyId: string
  tenantId: string
  startDate: string // YYYY-MM-DD
  endDate: string
  currency: string
  monthlyAmount: number
  securityDeposit?: number | null
  paymentDueDay: number
  notes?: string | null
}

export interface RentalCreated {
  id: string
  applicationId: string
  propertyId: string
  tenantId: string
  startDate: string
  endDate: string
  currency: string
  monthlyAmount: number
  securityDeposit: number | null
  paymentDueDay: number
  notes: string | null
  status: string
}

export interface RentalListItem {
  id: string
  code: string
  propertyId: string
  propertyAddress: string
  propertyCode: string
  tenantId: string
  tenantName: string
  ownerId: string
  ownerName: string
  startDate: string
  endDate: string
  currency: string
  monthlyAmount: number
  securityDeposit: number | null
  status: string
  hasContract: boolean
}

export interface ListRentalsParams {
  applicationSlug?: string
  page?: number
  limit?: number
  search?: string
  status?: 'ACTIVE' | 'EXPIRED' | 'CANCELLED'
}

export interface ListRentalsResponse {
  data: RentalListItem[]
  total: number
  page: number
  limit: number
}

export interface RentalStats {
  total: number
  vigentes: number
  porVencer: number
  vencidos: number
}

export const rentalsService = {
  getList: (params: ListRentalsParams) => {
    const searchParams = new URLSearchParams()
    searchParams.set('applicationSlug', params.applicationSlug ?? 'alquileres')
    searchParams.set('page', String(params.page ?? 1))
    searchParams.set('limit', String(params.limit ?? 10))
    if (params.search) searchParams.set('search', params.search)
    if (params.status) searchParams.set('status', params.status)
    return apiClient
      .get<ListRentalsResponse>(`/rentals?${searchParams.toString()}`)
      .then((r) => r.data)
  },

  getStats: (applicationSlug = 'alquileres') =>
    apiClient
      .get<RentalStats>(`/rentals/stats?applicationSlug=${applicationSlug}`)
      .then((r) => r.data),

  create: (
    data: CreateRentalPayload,
    files?: { contractFile?: File; deliveryActFile?: File }
  ) => {
    const form = new FormData()
    form.append('applicationSlug', data.applicationSlug ?? 'alquileres')
    form.append('propertyId', data.propertyId)
    form.append('tenantId', data.tenantId)
    form.append('startDate', data.startDate)
    form.append('endDate', data.endDate)
    form.append('currency', data.currency)
    form.append('monthlyAmount', String(data.monthlyAmount))
    if (data.securityDeposit != null)
      form.append('securityDeposit', String(data.securityDeposit))
    form.append('paymentDueDay', String(data.paymentDueDay))
    if (data.notes != null) form.append('notes', data.notes)
    if (files?.contractFile) form.append('contractFile', files.contractFile)
    if (files?.deliveryActFile)
      form.append('deliveryActFile', files.deliveryActFile)
    return apiClient
      .post<RentalCreated>('/rentals', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },
}
