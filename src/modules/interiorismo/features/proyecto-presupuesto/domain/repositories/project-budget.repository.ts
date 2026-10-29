import type {
  BudgetRowFields,
  BudgetSheetDto,
  CreateBudgetRowsPayload,
  CreateBudgetRowsResult,
  CreateBudgetSupplierPaymentPayload,
  ImportBudgetFromExcelResult,
  MoveBudgetRowPayload,
  ProjectBudgetAttachmentDto,
  ProjectSettlementDto,
  SyncBudgetFromExecutionResult,
  UpdateBudgetHeaderPayload,
} from '../project-budget.types'
/** Toda mutación devuelve la hoja completa recalculada. */
export interface ProjectBudgetRepository {
  getSheet(projectId: string): Promise<BudgetSheetDto>
  getSettlement(projectId: string): Promise<ProjectSettlementDto>
  updateHeader(projectId: string, payload: UpdateBudgetHeaderPayload): Promise<BudgetSheetDto>
  createRows(projectId: string, payload: CreateBudgetRowsPayload): Promise<CreateBudgetRowsResult>
  updateRow(projectId: string, rowId: string, payload: BudgetRowFields): Promise<BudgetSheetDto>
  moveRow(projectId: string, rowId: string, payload: MoveBudgetRowPayload): Promise<BudgetSheetDto>
  deleteRow(projectId: string, rowId: string): Promise<BudgetSheetDto>
  createSupplierPayment(
    projectId: string,
    rowId: string,
    payload: CreateBudgetSupplierPaymentPayload,
  ): Promise<BudgetSheetDto>
  deleteSupplierPayment(projectId: string, paymentId: string): Promise<BudgetSheetDto>
  duplicateSnapshot(projectId: string): Promise<BudgetSheetDto>
  activateVersion(projectId: string, budgetId: string): Promise<BudgetSheetDto>
  syncFromExecution(projectId: string): Promise<SyncBudgetFromExecutionResult>
  importExcel(projectId: string, file: File, replace?: boolean): Promise<ImportBudgetFromExcelResult>
  exportExcel(projectId: string): Promise<Blob>
  fetchPdfHtml(projectId: string): Promise<string>
  listAttachments(projectId: string, lineItemId?: string | null): Promise<ProjectBudgetAttachmentDto[]>
  uploadAttachment(
    projectId: string,
    file: File,
    payload?: { lineItemId?: string | null },
  ): Promise<ProjectBudgetAttachmentDto>
  deleteAttachment(projectId: string, attachmentId: string): Promise<void>
  getAttachmentDownloadUrl(attachmentId: string): Promise<string>
}
