import type {
  CreateInteriorProjectActivityPayload,
  CreateInteriorProjectPayload,
  InteriorClientPaymentDto,
  InteriorClientProjectsSummary,
  InteriorProjectDetail,
  InteriorProjectStats,
  ListInteriorProjectsParams,
  ListInteriorProjectsResponse,
  UpdateInteriorProjectPayload,
} from '../project.types'
export interface InteriorProjectsRepository {
  getList: (params: ListInteriorProjectsParams) => Promise<ListInteriorProjectsResponse>
  getById: (id: string) => Promise<InteriorProjectDetail>
  create: (payload: CreateInteriorProjectPayload) => Promise<InteriorProjectDetail>
  update: (id: string, payload: UpdateInteriorProjectPayload) => Promise<InteriorProjectDetail>
  getStats: () => Promise<InteriorProjectStats>
  getClientsSummary: (clientIds: string[]) => Promise<InteriorClientProjectsSummary[]>
  getClientPayments: (clientId: string) => Promise<InteriorClientPaymentDto[]>
  createActivity: (projectId: string, payload: CreateInteriorProjectActivityPayload) => Promise<InteriorProjectDetail>
  deleteActivity: (projectId: string, activityId: string) => Promise<InteriorProjectDetail>
}
