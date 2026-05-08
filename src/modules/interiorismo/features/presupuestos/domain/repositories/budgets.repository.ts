import type {
  CreateInteriorBudgetPayload,
  InteriorBudgetCommentDto,
  InteriorBudgetDetail,
  InteriorBudgetAttachmentDto,
  ListInteriorBudgetsParams,
  ListInteriorBudgetsResponse,
  UpdateInteriorBudgetPayload,
} from '../budget.types'

export interface InteriorBudgetsRepository {
  getList(params: ListInteriorBudgetsParams): Promise<ListInteriorBudgetsResponse>
  getById(id: string): Promise<InteriorBudgetDetail>
  create(payload: CreateInteriorBudgetPayload): Promise<InteriorBudgetDetail>
  update(id: string, payload: UpdateInteriorBudgetPayload): Promise<InteriorBudgetDetail>
  duplicate(id: string): Promise<InteriorBudgetDetail>
  addComment(id: string, body: string): Promise<InteriorBudgetCommentDto>
  addAttachment(id: string, title: string, fileUrl: string): Promise<InteriorBudgetAttachmentDto>
  fetchPdfHtml(id: string): Promise<string>
}
