import type { TeamMemberType, TeamRole } from '../domain/team.types'

export const TEAM_ROLE_LABELS: Record<TeamRole, string> = {
  DESIGNER: 'Diseñador(a)',
  ARCHITECT_SR: 'Arquitecto senior',
  ARCHITECT_JR: 'Arquitecto junior',
  SUPERVISOR: 'Supervisor de obra',
  COMMERCIAL: 'Asesor comercial',
}

export const TEAM_MEMBER_TYPE_LABELS: Record<TeamMemberType, string> = {
  INTERNAL: 'Personal propio',
  EXTERNAL: 'Colaborador externo',
}
