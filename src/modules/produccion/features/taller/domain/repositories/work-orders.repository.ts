import type {
  CreateWorkOrderPayload,
  ListWorkOrdersParams,
  ProduccionWorkOrderDetail,
  ProduccionWorkOrderListItem,
  ProduccionWorkOrderStats,
} from '../work-orders.types'
export interface ProduccionWorkOrdersRepository {
  list: (
    params?: ListWorkOrdersParams,
  ) => Promise<{ data: ProduccionWorkOrderListItem[]; total: number }>
  getStats: () => Promise<ProduccionWorkOrderStats>
  getById: (id: string) => Promise<ProduccionWorkOrderDetail>
  create: (payload: CreateWorkOrderPayload) => Promise<ProduccionWorkOrderDetail>
  update: (
    id: string,
    payload: Partial<CreateWorkOrderPayload>,
  ) => Promise<ProduccionWorkOrderDetail>
  start: (id: string) => Promise<ProduccionWorkOrderDetail>
  updateStage: (
    id: string,
    stageId: string,
    payload: { assignee?: string | null; notes?: string | null; markDone?: boolean },
  ) => Promise<ProduccionWorkOrderDetail>
  complete: (id: string) => Promise<ProduccionWorkOrderDetail>
  cancel: (id: string) => Promise<ProduccionWorkOrderDetail>
  consumeMaterials: (
    id: string,
    items: { materialId: string; quantity: number; notes?: string | null }[],
  ) => Promise<ProduccionWorkOrderDetail>
  delete: (id: string) => Promise<undefined>
}
