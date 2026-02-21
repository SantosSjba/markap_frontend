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

export const rentalsService = {
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
