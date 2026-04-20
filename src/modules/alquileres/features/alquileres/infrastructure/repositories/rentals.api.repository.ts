import { apiClient } from '@core/api/apiClient'
import { ALQUILERES_APP_SLUG } from '../../../../config/app.constants'
import type {
  CreateRentalPayload,
  ListRentalsParams,
  ListRentalsResponse,
  RentalCreated,
  RentalDetail,
  RentalFinancialBreakdown,
  RentalFinancialConfig,
  RentalStats,
  UpdateRentalPayload,
  UpsertRentalFinancialConfigPayload,
} from '../../domain/rental.types'
import type { RentalsRepository } from '../../domain/repositories/rentals.repository'
import {
  mapListRentalsResponse,
  mapRentalCreated,
  mapRentalDetail,
  mapRentalFinancialBreakdown,
  mapRentalFinancialConfig,
  mapRentalStats,
} from '../mappers/rental.mapper'

export const rentalsApiRepository: RentalsRepository = {
  getById: (id: string) =>
    apiClient.get<RentalDetail>(`/rentals/${id}`).then((r) => mapRentalDetail(r.data)),

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
        .then((r) => mapRentalCreated(r.data))
    }
    return apiClient.patch<RentalCreated>(`/rentals/${id}`, data).then((r) => mapRentalCreated(r.data))
  },

  getList: (params: ListRentalsParams) => {
    const searchParams = new URLSearchParams()
    searchParams.set('applicationSlug', params.applicationSlug ?? ALQUILERES_APP_SLUG)
    searchParams.set('page', String(params.page ?? 1))
    searchParams.set('limit', String(params.limit ?? 10))
    if (params.search) searchParams.set('search', params.search)
    if (params.status) searchParams.set('status', params.status)
    return apiClient
      .get<ListRentalsResponse>(`/rentals?${searchParams.toString()}`)
      .then((r) => mapListRentalsResponse(r.data))
  },

  getStats: (applicationSlug = ALQUILERES_APP_SLUG) =>
    apiClient
      .get<RentalStats>(`/rentals/stats?applicationSlug=${applicationSlug}`)
      .then((r) => mapRentalStats(r.data)),

  getFinancialConfig: (rentalId: string) =>
    apiClient
      .get<RentalFinancialConfig | null>(`/rentals/${rentalId}/financial-config`)
      .then((r) => mapRentalFinancialConfig(r.data)),

  getFinancialBreakdown: (rentalId: string) =>
    apiClient
      .get<RentalFinancialBreakdown>(`/rentals/${rentalId}/financial-breakdown`)
      .then((r) => mapRentalFinancialBreakdown(r.data)),

  upsertFinancialConfig: (rentalId: string, data: UpsertRentalFinancialConfigPayload) =>
    apiClient
      .put<RentalFinancialConfig>(`/rentals/${rentalId}/financial-config`, data)
      .then((r) => mapRentalFinancialConfig(r.data) as RentalFinancialConfig),

  cancel: (id: string) => apiClient.delete(`/rentals/${id}`).then((r) => r.data),

  create: (
    data: CreateRentalPayload,
    files?: { contractFile?: File; deliveryActFile?: File },
  ) => {
    const form = new FormData()
    form.append('applicationSlug', data.applicationSlug ?? ALQUILERES_APP_SLUG)
    form.append('propertyId', data.propertyId)
    form.append('tenantId', data.tenantId)
    form.append('startDate', data.startDate)
    form.append('endDate', data.endDate)
    form.append('currency', data.currency)
    form.append('monthlyAmount', String(data.monthlyAmount))
    if (data.securityDeposit != null) form.append('securityDeposit', String(data.securityDeposit))
    form.append('paymentDueDay', String(data.paymentDueDay))
    if (data.notes != null) form.append('notes', data.notes)
    form.append('enableAlerts', String(data.enableAlerts ?? true))
    if (files?.contractFile) form.append('contractFile', files.contractFile)
    if (files?.deliveryActFile) form.append('deliveryActFile', files.deliveryActFile)
    return apiClient
      .post<RentalCreated>('/rentals', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => mapRentalCreated(r.data))
  },
}

/** Instancia por defecto del puerto (misma referencia que el adaptador HTTP). */
export const rentalsRepository = rentalsApiRepository
