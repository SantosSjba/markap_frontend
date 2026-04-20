import type {
  SaleClosingRow,
  SaleProcessDetail,
  SaleProcessListRow,
  SaleSeparationRow,
} from '../sales.types'

/**
 * Puerto (contrato) de acceso a datos de ventas — desacopla application del transporte HTTP.
 */
export interface VentasSalesRepository {
  listProcesses: (params: {
    page?: number
    limit?: number
    search?: string
    pipelineStage?: string
    status?: string
  }) => Promise<{ data: SaleProcessListRow[]; total: number }>

  getProcess: (id: string) => Promise<SaleProcessDetail>

  createProcess: (body: {
    buyerClientId: string
    propertyId: string
    agentId?: string | null
    title?: string | null
    pipelineStage?: string
  }) => Promise<unknown>

  updateProcess: (
    id: string,
    body: {
      pipelineStage?: string
      status?: 'ACTIVE' | 'WON' | 'LOST'
      agentId?: string | null
      title?: string | null
    },
  ) => Promise<unknown>

  addNote: (processId: string, text: string) => Promise<unknown>

  addActivity: (
    processId: string,
    body: {
      activityType: string
      title: string
      description?: string | null
    },
  ) => Promise<unknown>

  addReminder: (processId: string, body: { title: string; dueAt: string }) => Promise<unknown>

  completeReminder: (reminderId: string) => Promise<unknown>

  listSeparations: (params: { page?: number; limit?: number; status?: string }) => Promise<{
    data: SaleSeparationRow[]
    total: number
  }>

  createSeparation: (body: {
    propertyId: string
    buyerClientId: string
    saleProcessId?: string | null
    amount: number
    currency?: string
    separationDate: string
    expiresAt?: string | null
    notes?: string | null
  }) => Promise<unknown>

  patchSeparation: (
    id: string,
    body: { status?: 'ACTIVE' | 'EXPIRED' | 'CLOSED'; notes?: string | null },
  ) => Promise<unknown>

  listClosings: (params: { page?: number; limit?: number }) => Promise<{
    data: SaleClosingRow[]
    total: number
  }>

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
  }) => Promise<unknown>
}
