import { apiClient } from '@core/api/apiClient'
import {
  VENTAS_SALES_APP_SLUG,
  type SaleClosingRow,
  type SaleProcessDetail,
  type SaleProcessListRow,
  type SaleSeparationRow,
} from '../../domain/sales.types'
import type { VentasSalesRepository } from '../../domain/repositories/ventas-sales.repository'
import {
  mapSaleClosingsListPayload,
  mapSaleProcessDetail,
  mapSaleProcessesListPayload,
  mapSaleSeparationsListPayload,
} from '../mappers/ventas-sales-api.mapper'

const scope = { applicationSlug: VENTAS_SALES_APP_SLUG } as const

function qs(params: Record<string, string | number | undefined>) {
  const u = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') u.set(k, String(v))
  })
  return u.toString()
}

const api: VentasSalesRepository = {
  listProcesses: (params: {
    page?: number
    limit?: number
    search?: string
    pipelineStage?: string
    status?: string
  }) =>
    apiClient
      .get<{ data: SaleProcessListRow[]; total: number }>(
        `/ventas-sales/processes?${qs({ ...scope, ...params })}`,
      )
      .then((r) => mapSaleProcessesListPayload(r.data)),

  getProcess: (id: string) =>
    apiClient
      .get<SaleProcessDetail>(`/ventas-sales/processes/${encodeURIComponent(id)}?${qs({ ...scope })}`)
      .then((r) => mapSaleProcessDetail(r.data)),

  createProcess: (body: {
    buyerClientId: string
    propertyId: string
    agentId?: string | null
    title?: string | null
    pipelineStage?: string
  }) =>
    apiClient.post(`/ventas-sales/processes?${qs({ ...scope })}`, body).then((r) => r.data),

  updateProcess: (
    id: string,
    body: {
      pipelineStage?: string
      status?: 'ACTIVE' | 'WON' | 'LOST'
      agentId?: string | null
      title?: string | null
    },
  ) =>
    apiClient
      .patch(`/ventas-sales/processes/${encodeURIComponent(id)}?${qs({ ...scope })}`, body)
      .then((r) => r.data),

  addNote: (processId: string, text: string) =>
    apiClient
      .post(`/ventas-sales/processes/${encodeURIComponent(processId)}/notes?${qs({ ...scope })}`, {
        text,
      })
      .then((r) => r.data),

  addActivity: (
    processId: string,
    body: {
      activityType: string
      title: string
      description?: string | null
    },
  ) =>
    apiClient
      .post(
        `/ventas-sales/processes/${encodeURIComponent(processId)}/activities?${qs({ ...scope })}`,
        body,
      )
      .then((r) => r.data),

  addReminder: (processId: string, body: { title: string; dueAt: string }) =>
    apiClient
      .post(
        `/ventas-sales/processes/${encodeURIComponent(processId)}/reminders?${qs({ ...scope })}`,
        body,
      )
      .then((r) => r.data),

  completeReminder: (reminderId: string) =>
    apiClient
      .patch(`/ventas-sales/reminders/${encodeURIComponent(reminderId)}/complete?${qs({ ...scope })}`)
      .then((r) => r.data),

  listSeparations: (params: { page?: number; limit?: number; status?: string }) =>
    apiClient
      .get<{ data: SaleSeparationRow[]; total: number }>(
        `/ventas-sales/separations?${qs({ ...scope, ...params })}`,
      )
      .then((r) => mapSaleSeparationsListPayload(r.data)),

  createSeparation: (body: {
    propertyId: string
    buyerClientId: string
    saleProcessId?: string | null
    amount: number
    currency?: string
    separationDate: string
    expiresAt?: string | null
    notes?: string | null
  }) =>
    apiClient.post(`/ventas-sales/separations?${qs({ ...scope })}`, body).then((r) => r.data),

  patchSeparation: (
    id: string,
    body: { status?: 'ACTIVE' | 'EXPIRED' | 'CLOSED'; notes?: string | null },
  ) =>
    apiClient
      .patch(`/ventas-sales/separations/${encodeURIComponent(id)}?${qs({ ...scope })}`, body)
      .then((r) => r.data),

  listClosings: (params: { page?: number; limit?: number }) =>
    apiClient
      .get<{ data: SaleClosingRow[]; total: number }>(
        `/ventas-sales/closings?${qs({ ...scope, ...params })}`,
      )
      .then((r) => mapSaleClosingsListPayload(r.data)),

  createClosing: (body: {
    propertyId: string
    buyerClientId: string
    saleProcessId?: string | null
    saleSeparationId?: string | null
    agentId?: string | null
    finalPrice: number
    paymentType: string
    notes?: string | null
    commissionAgentId?: string | null
    commissionAmount?: number
    commissionPercent?: number | null
    commissionAutoFromProfile?: boolean
  }) =>
    apiClient.post(`/ventas-sales/closings?${qs({ ...scope })}`, body).then((r) => r.data),
}

/** Adaptador HTTP (implementación del puerto VentasSalesRepository). */
export const ventasSalesApiRepository = api

/** @deprecated Preferir `ventasSalesRepository` o `ventasSalesApiRepository`. */
export const ventasSalesService = ventasSalesApiRepository

/** Instancia por defecto del puerto (misma referencia que el adaptador HTTP). */
export const ventasSalesRepository = ventasSalesApiRepository
