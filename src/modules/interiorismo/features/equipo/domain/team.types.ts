/**
 * Equipo de Interiorismo: integrantes que figuran como responsables de proyectos
 * (diseño, arquitectura, obra, comercial). Es un registro informativo: no inicia sesión
 * ni accede a los proyectos. Se guarda en la tabla de agentes de la aplicación.
 */

export const TEAM_ROLES = ['DESIGNER', 'ARCHITECT_SR', 'ARCHITECT_JR', 'SUPERVISOR', 'COMMERCIAL'] as const
export type TeamRole = (typeof TEAM_ROLES)[number]

/** Personal propio de la empresa o colaborador externo */
export type TeamMemberType = 'INTERNAL' | 'EXTERNAL'

export interface TeamMember {
  id: string
  type: TeamMemberType
  fullName: string
  email: string | null
  phone: string | null
  documentTypeId: string | null
  documentNumber: string | null
  roles: TeamRole[]
  isActive: boolean
  createdAt: string
  updatedAt: string
  documentType?: { code: string; name: string } | null
}

export interface ListTeamParams {
  page?: number
  limit?: number
  search?: string
  type?: TeamMemberType
  role?: TeamRole
  isActive?: boolean
}

export interface ListTeamResult {
  data: TeamMember[]
  total: number
  page: number
  limit: number
}

export interface TeamMemberFormPayload {
  type: TeamMemberType
  fullName: string
  email: string | null
  phone: string | null
  documentTypeId: string | null
  documentNumber: string | null
  roles: TeamRole[]
}

export type UpdateTeamMemberPayload = Partial<TeamMemberFormPayload> & { isActive?: boolean }
