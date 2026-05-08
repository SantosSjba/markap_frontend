import type {
  CreateInteriorProjectPayload,
  InteriorProjectDetail,
  ListInteriorProjectsParams,
  ListInteriorProjectsResponse,
} from '../project.types'

export interface InteriorProjectsRepository {
  getList: (params: ListInteriorProjectsParams) => Promise<ListInteriorProjectsResponse>
  getById: (id: string) => Promise<InteriorProjectDetail>
  create: (payload: CreateInteriorProjectPayload) => Promise<InteriorProjectDetail>
}
