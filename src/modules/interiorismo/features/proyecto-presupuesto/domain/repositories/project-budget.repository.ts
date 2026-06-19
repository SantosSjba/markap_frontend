import type {
  CreateLineItemSupplierPaymentPayload,
  CreateProjectBudgetLineItemPayload,
  CreateProjectBudgetSectionPayload,
  DuplicateBudgetSnapshotResult,
  ProjectBudgetDetailDto,
  ProjectBudgetLineItemDto,
  ProjectBudgetSectionDto,
  ProjectSettlementDto,
  SyncBudgetFromExecutionResult,
  ImportBudgetFromExcelResult,
  ProjectBudgetAttachmentDto,
  UpdateProjectBudgetLineItemPayload,
  UpdateProjectBudgetSectionPayload,
} from '../project-budget.types'

export interface ProjectBudgetRepository {
  getBudget(projectId: string): Promise<ProjectBudgetDetailDto>
  getSettlement(projectId: string): Promise<ProjectSettlementDto>
  createSection(projectId: string, payload: CreateProjectBudgetSectionPayload): Promise<ProjectBudgetSectionDto>
  updateSection(
    projectId: string,
    sectionId: string,
    payload: UpdateProjectBudgetSectionPayload,
  ): Promise<ProjectBudgetSectionDto>
  deleteSection(projectId: string, sectionId: string): Promise<void>
  createLineItem(
    projectId: string,
    payload: CreateProjectBudgetLineItemPayload,
  ): Promise<ProjectBudgetLineItemDto>
  updateLineItem(
    projectId: string,
    lineItemId: string,
    payload: UpdateProjectBudgetLineItemPayload,
  ): Promise<ProjectBudgetLineItemDto>
  deleteLineItem(projectId: string, lineItemId: string): Promise<void>
  createSupplierPayment(
    projectId: string,
    payload: CreateLineItemSupplierPaymentPayload,
  ): Promise<ProjectBudgetLineItemDto>
  deleteSupplierPayment(projectId: string, paymentId: string): Promise<void>
  fetchPdfHtml(projectId: string): Promise<string>
  duplicateSnapshot(projectId: string): Promise<DuplicateBudgetSnapshotResult>
  syncFromExecution(projectId: string): Promise<SyncBudgetFromExecutionResult>
  importExcel(projectId: string, file: File, replace?: boolean): Promise<ImportBudgetFromExcelResult>
  listAttachments(projectId: string, lineItemId?: string | null): Promise<ProjectBudgetAttachmentDto[]>
  uploadAttachment(
    projectId: string,
    file: File,
    payload?: { lineItemId?: string | null },
  ): Promise<ProjectBudgetAttachmentDto>
  deleteAttachment(projectId: string, attachmentId: string): Promise<void>
  getAttachmentDownloadUrl(attachmentId: string): Promise<string>
}
