import { apiClient } from '@app/api/apiClient'

const scope = { applicationSlug: 'ventas' } as const

export interface SaleProcessListRow {
  id: string
  code: string
  title: string | null
  pipelineStage: string
  status: string
  buyer: { id: string; fullName: string; primaryPhone: string }
  property: { id: string; code: string; addressLine: string; salePrice: number | null }
  agent: { id: string; fullName: string } | null
}

export interface SaleSeparationRow {
  id: string
  amount: number
  currency: string
  separationDate: string
  status: string
  receiptFilePath: string | null
  buyer: { id: string; fullName: string }
  property: { id: string; code: string; addressLine: string }
  saleProcess: { id: string; code: string } | null
}

export interface SaleClosingRow {
  id: string
  finalPrice: number
  paymentType: string
  closedAt: string
  contractFilePath: string | null
  buyer: { id: string; fullName: string }
  property: { id: string; code: string; addressLine: string }
  agent: { id: string; fullName: string } | null
  commission: {
    id: string
    amount: number
    status: string
    percentApplied: number | null
  } | null
}

export interface SaleProcessNoteRow {
  id: string
  body: string
  createdAt: string
}

export interface SaleProcessActivityRow {
  id: string
  activityType: string
  title: string
  description: string | null
  createdAt: string
}

export interface SaleProcessReminderRow {
  id: string
  title: string
  dueAt: string
  completedAt: string | null
}

/** Detalle de proceso (GET /processes/:id) */
export interface SaleProcessDetail extends SaleProcessListRow {
  notes: SaleProcessNoteRow[]
  activities: SaleProcessActivityRow[]
  reminders: SaleProcessReminderRow[]
}

function qs(params: Record<string, string | number | undefined>) {
  const u = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') u.set(k, String(v))
  })
  return u.toString()
}

export const ventasSalesService = {
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
      .then((r) => r.data),

  getProcess: (id: string) =>
    apiClient
      .get<SaleProcessDetail>(`/ventas-sales/processes/${encodeURIComponent(id)}?${qs({ ...scope })}`)
      .then((r) => r.data),

  createProcess: (body: {
    buyerClientId: string
    propertyId: string
    agentId?: string | null
    title?: string | null
    pipelineStage?: string
  }) =>
    apiClient
      .post(`/ventas-sales/processes?${qs({ ...scope })}`, body)
      .then((r) => r.data),

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
      .then((r) => r.data),

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
    apiClient
      .post(`/ventas-sales/separations?${qs({ ...scope })}`, body)
      .then((r) => r.data),

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
      .then((r) => r.data),

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
    apiClient
      .post(`/ventas-sales/closings?${qs({ ...scope })}`, body)
      .then((r) => r.data),
}
