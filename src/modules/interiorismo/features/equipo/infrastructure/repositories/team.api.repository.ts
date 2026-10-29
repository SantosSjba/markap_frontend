import { apiClient } from '@shared/infrastructure/http/api-client'
import { INTERIORISMO_APP_SLUG } from '../../../../config/app.constants'
import type {
  ListTeamParams,
  ListTeamResult,
  TeamMember,
  TeamMemberFormPayload,
  UpdateTeamMemberPayload,
} from '../../domain/team.types'
import type { InteriorTeamRepository } from '../../domain/repositories/team.repository'
/** El equipo vive en `/agents`, acotado a la aplicación Interiorismo y sin usuario vinculado. */
const BASE = '/agents'

const scope = { applicationSlug: INTERIORISMO_APP_SLUG }

export const interiorTeamApiRepository: InteriorTeamRepository = {
  list(params: ListTeamParams): Promise<ListTeamResult> {
    return apiClient
      .get(BASE, {
        params: {
          ...scope,
          page: params.page,
          limit: params.limit,
          search: params.search || undefined,
          type: params.type,
          role: params.role,
          isActive: params.isActive,
        },
      })
      .then((r) => r.data)
  },

  getById(id: string): Promise<TeamMember> {
    return apiClient.get(`${BASE}/${encodeURIComponent(id)}`, { params: scope }).then((r) => r.data)
  },

  create(payload: TeamMemberFormPayload): Promise<TeamMember> {
    return apiClient.post(BASE, { ...payload, ...scope, userId: null }).then((r) => r.data)
  },

  update(id: string, payload: UpdateTeamMemberPayload): Promise<TeamMember> {
    return apiClient
      .patch(`${BASE}/${encodeURIComponent(id)}`, payload, { params: scope })
      .then((r) => r.data)
  },

  delete(id: string): Promise<{ message: string }> {
    return apiClient.delete(`${BASE}/${encodeURIComponent(id)}`, { params: scope }).then((r) => r.data)
  },
}
