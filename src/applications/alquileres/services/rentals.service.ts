import { apiClient } from '@app/api/apiClient'

/** Construye la URL pública de un adjunto a partir de su filePath relativo */
export function getAttachmentUrl(filePath: string): string {
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
  const serverRoot = apiBase.replace(/\/api$/, '')
  return `${serverRoot}/uploads/${filePath}`
}

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
  enableAlerts?: boolean
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
  enableAlerts: boolean
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

export interface RentalAttachment {
  id: string
  type: 'CONTRACT' | 'DELIVERY_ACT'
  filePath: string
  originalFileName: string
}

export interface RentalDetail {
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
  enableAlerts: boolean
  code: string
  property: {
    id: string
    code: string
    addressLine: string
    ownerId: string
    owner: { id: string; fullName: string }
  }
  tenant: { id: string; fullName: string }
  hasContract: boolean
  hasDeliveryAct: boolean
  attachments?: RentalAttachment[]
}

export interface UpdateRentalPayload {
  startDate?: string
  endDate?: string
  currency?: string
  monthlyAmount?: number
  securityDeposit?: number | null
  paymentDueDay?: number
  notes?: string | null
  status?: 'ACTIVE' | 'EXPIRED' | 'CANCELLED'
  enableAlerts?: boolean
}

export type FinancialValueType = 'PERCENT' | 'FIXED'

export interface RentalFinancialConfig {
  id: string
  rentalId: string
  currency: string
  /** Monto ingresado por la empresa al concretar el alquiler. null = usar monthlyAmount del contrato. */
  baseAmount: number | null
  expenseType: FinancialValueType
  expenseValue: number
  taxType: FinancialValueType
  taxValue: number
  externalAgentId: string | null
  externalAgentType: FinancialValueType
  externalAgentValue: number
  externalAgentName: string | null
  internalAgentId: string | null
  internalAgentType: FinancialValueType
  internalAgentValue: number
  createdAt: string
  updatedAt: string
}

export interface RentalFinancialBreakdown {
  /** Monto mensual del contrato */
  monthlyAmount: number
  /** Monto base usado para el cálculo (baseAmount si está configurado, sino monthlyAmount) */
  baseAmount: number
  currency: string
  expense: number
  tax: number
  externalAgentCommission: number
  internalAgentCommission: number
  utility: number
  config: RentalFinancialConfig | null
}

export interface UpsertRentalFinancialConfigPayload {
  currency?: string
  /** Monto ingresado al concretar el alquiler (base para descuentos). null = usar monthlyAmount. */
  baseAmount?: number | null
  expenseType?: FinancialValueType
  expenseValue?: number
  taxType?: FinancialValueType
  taxValue?: number
  externalAgentId?: string | null
  externalAgentType?: FinancialValueType
  externalAgentValue?: number
  externalAgentName?: string | null
  internalAgentId?: string | null
  internalAgentType?: FinancialValueType
  internalAgentValue?: number
}

export const rentalsService = {
  getById: (id: string) =>
    apiClient.get<RentalDetail>(`/rentals/${id}`).then((r) => r.data),

  update: (
    id: string,
    data: UpdateRentalPayload,
    files?: { contractFile?: File; deliveryActFile?: File },
  ) => {
    if (files?.contractFile || files?.deliveryActFile) {
      const form = new FormData()
      if (data.startDate != null) form.append('startDate', data.startDate)
      if (data.endDate != null) form.append('endDate', data.endDate)
      if (data.currency != null) form.append('currency', data.currency)
      if (data.monthlyAmount != null) form.append('monthlyAmount', String(data.monthlyAmount))
      if (data.securityDeposit != null) form.append('securityDeposit', String(data.securityDeposit))
      if (data.paymentDueDay != null) form.append('paymentDueDay', String(data.paymentDueDay))
      if (data.notes != null) form.append('notes', data.notes)
      if (data.status != null) form.append('status', data.status)
      if (data.enableAlerts != null) form.append('enableAlerts', String(data.enableAlerts))
      if (files.contractFile) form.append('contractFile', files.contractFile)
      if (files.deliveryActFile) form.append('deliveryActFile', files.deliveryActFile)
      return apiClient
        .patch<RentalCreated>(`/rentals/${id}`, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then((r) => r.data)
    }
    return apiClient.patch<RentalCreated>(`/rentals/${id}`, data).then((r) => r.data)
  },

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

  getFinancialConfig: (rentalId: string) =>
    apiClient
      .get<RentalFinancialConfig | null>(`/rentals/${rentalId}/financial-config`)
      .then((r) => r.data),

  getFinancialBreakdown: (rentalId: string) =>
    apiClient
      .get<RentalFinancialBreakdown>(`/rentals/${rentalId}/financial-breakdown`)
      .then((r) => r.data),

  upsertFinancialConfig: (rentalId: string, data: UpsertRentalFinancialConfigPayload) =>
    apiClient
      .put<RentalFinancialConfig>(`/rentals/${rentalId}/financial-config`, data)
      .then((r) => r.data),

  cancel: (id: string): Promise<{ message: string }> =>
    apiClient.delete(`/rentals/${id}`).then((r) => r.data),

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
    form.append('enableAlerts', String(data.enableAlerts ?? true))
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
