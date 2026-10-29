import type {
  ListTeamParams,
  ListTeamResult,
  TeamMember,
  TeamMemberFormPayload,
  UpdateTeamMemberPayload,
} from '../team.types'
export interface InteriorTeamRepository {
  list(params: ListTeamParams): Promise<ListTeamResult>
  getById(id: string): Promise<TeamMember>
  create(payload: TeamMemberFormPayload): Promise<TeamMember>
  update(id: string, payload: UpdateTeamMemberPayload): Promise<TeamMember>
  delete(id: string): Promise<{ message: string }>
}
