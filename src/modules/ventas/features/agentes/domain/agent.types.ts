/** Tipos de dominio — agentes del módulo Ventas (independiente de Alquileres). */

export const VENTAS_AGENTS_APPLICATION_SLUG = 'ventas' as const

export type VentasAgentType = 'INTERNAL' | 'EXTERNAL'

export interface VentasAgentListItem {
  id: string
  applicationId: string
  type: VentasAgentType
  userId: string | null
  fullName: string
  email: string | null
  phone: string | null
  documentTypeId: string | null
  documentNumber: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  user?: { id: string; firstName: string; lastName: string } | null
  documentType?: { code: string; name: string } | null
}

export interface ListVentasAgentsParams {
  page?: number
  limit?: number
  search?: string
  type?: VentasAgentType
  isActive?: boolean
}

export interface ListVentasAgentsResult {
  data: VentasAgentListItem[]
  total: number
  page: number
  limit: number
}

export interface CreateVentasAgentPayload {
  type: VentasAgentType
  userId?: string | null
  fullName: string
  email?: string | null
  phone?: string | null
  documentTypeId?: string | null
  documentNumber?: string | null
}

export interface UpdateVentasAgentPayload {
  type?: VentasAgentType
  userId?: string | null
  fullName?: string
  email?: string | null
  phone?: string | null
  documentTypeId?: string | null
  documentNumber?: string | null
  isActive?: boolean
}
