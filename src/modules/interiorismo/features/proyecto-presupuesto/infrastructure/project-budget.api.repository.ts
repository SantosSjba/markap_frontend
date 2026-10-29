import { apiClient } from '@shared/infrastructure/http/api-client'
import { INTERIORISMO_APP_SLUG } from '../../../config/app.constants'
import type { ProjectBudgetRepository } from '../domain/repositories/project-budget.repository'
import type {
  BudgetSheetDto,
  CreateBudgetRowsResult,
  ImportBudgetFromExcelResult,
  ProjectBudgetAttachmentDto,
  ProjectSettlementDto,
  SyncBudgetFromExecutionResult,
} from '../domain/project-budget.types'
const slug = () => ({ applicationSlug: INTERIORISMO_APP_SLUG })
const base = (projectId: string) => `/interiorismo-projects/${projectId}`
const sheet = (p: Promise<{ data: BudgetSheetDto }>) => p.then((r) => r.data)

export const projectBudgetApiRepository: ProjectBudgetRepository = {
  getSheet: (projectId) =>
    sheet(apiClient.get<BudgetSheetDto>(`${base(projectId)}/budget`, { params: slug() })),

  getSettlement: (projectId) =>
    apiClient
      .get<ProjectSettlementDto>(`${base(projectId)}/settlement`, { params: slug() })
      .then((r) => r.data),

  updateHeader: (projectId, payload) =>
    sheet(apiClient.patch<BudgetSheetDto>(`${base(projectId)}/budget`, payload, { params: slug() })),

  createRows: (projectId, payload) =>
    apiClient
      .post<CreateBudgetRowsResult>(`${base(projectId)}/budget/rows`, payload, { params: slug() })
      .then((r) => r.data),

  updateRow: (projectId, rowId, payload) =>
    sheet(
      apiClient.patch<BudgetSheetDto>(`${base(projectId)}/budget/rows/${rowId}`, payload, {
        params: slug(),
      }),
    ),

  moveRow: (projectId, rowId, payload) =>
    sheet(
      apiClient.post<BudgetSheetDto>(`${base(projectId)}/budget/rows/${rowId}/move`, payload, {
        params: slug(),
      }),
    ),

  deleteRow: (projectId, rowId) =>
    sheet(apiClient.delete<BudgetSheetDto>(`${base(projectId)}/budget/rows/${rowId}`, { params: slug() })),

  createSupplierPayment: (projectId, rowId, payload) =>
    sheet(
      apiClient.post<BudgetSheetDto>(
        `${base(projectId)}/budget/rows/${rowId}/supplier-payments`,
        payload,
        { params: slug() },
      ),
    ),

  deleteSupplierPayment: (projectId, paymentId) =>
    sheet(
      apiClient.delete<BudgetSheetDto>(`${base(projectId)}/budget/supplier-payments/${paymentId}`, {
        params: slug(),
      }),
    ),

  duplicateSnapshot: (projectId) =>
    sheet(
      apiClient.post<BudgetSheetDto>(`${base(projectId)}/budget/duplicate-snapshot`, null, {
        params: slug(),
      }),
    ),

  activateVersion: (projectId, budgetId) =>
    sheet(
      apiClient.post<BudgetSheetDto>(
        `${base(projectId)}/budget/versions/${budgetId}/activate`,
        null,
        { params: slug() },
      ),
    ),

  syncFromExecution: (projectId) =>
    apiClient
      .post<SyncBudgetFromExecutionResult>(`${base(projectId)}/budget/sync-from-execution`, null, {
        params: slug(),
      })
      .then((r) => r.data),

  importExcel: (projectId, file, replace) => {
    const fd = new FormData()
    fd.append('file', file)
    return apiClient
      .post<ImportBudgetFromExcelResult>(`${base(projectId)}/budget/import-excel`, fd, {
        params: { ...slug(), ...(replace ? { replace: 'true' } : {}) },
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },

  exportExcel: (projectId) =>
    apiClient
      .get<Blob>(`${base(projectId)}/budget/export.xlsx`, { params: slug(), responseType: 'blob' })
      .then((r) => r.data),

  fetchPdfHtml: (projectId) =>
    apiClient
      .get(`${base(projectId)}/budget/pdf`, { params: slug(), responseType: 'text' })
      .then((r) => String(r.data)),

  listAttachments: (projectId, lineItemId) =>
    apiClient
      .get<ProjectBudgetAttachmentDto[]>(`${base(projectId)}/budget/attachments`, {
        params: { ...slug(), ...(lineItemId ? { lineItemId } : {}) },
      })
      .then((r) => r.data),

  uploadAttachment: (projectId, file, payload) => {
    const fd = new FormData()
    fd.append('file', file)
    if (payload?.lineItemId) fd.append('lineItemId', payload.lineItemId)
    return apiClient
      .post<ProjectBudgetAttachmentDto>(`${base(projectId)}/budget/attachments`, fd, {
        params: slug(),
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },

  deleteAttachment: (projectId, attachmentId) =>
    apiClient
      .delete(`${base(projectId)}/budget/attachments/${attachmentId}`, { params: slug() })
      .then(() => undefined),

  getAttachmentDownloadUrl: (attachmentId) =>
    apiClient
      .get<{ url: string }>(`/gen-archivos/${attachmentId}/url`, { params: slug() })
      .then((r) => r.data.url),
}
