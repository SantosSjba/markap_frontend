import { apiClient } from '@core/api/apiClient'
import { INTERIORISMO_APP_SLUG } from '@modules/interiorismo/config/app.constants'
import type { ProjectBudgetRepository } from '../domain/repositories/project-budget.repository'
import type {
  ProjectBudgetDetailDto,
  ProjectBudgetLineItemDto,
  ProjectBudgetSectionDto,
  ProjectSettlementDto,
  DuplicateBudgetSnapshotResult,
  SyncBudgetFromExecutionResult,
  ImportBudgetFromExcelResult,
  ProjectBudgetAttachmentDto,
} from '../domain/project-budget.types'

const slug = () => ({ applicationSlug: INTERIORISMO_APP_SLUG })
const base = (projectId: string) => `/interiorismo-projects/${projectId}`

export const projectBudgetApiRepository: ProjectBudgetRepository = {
  getBudget: (projectId) =>
    apiClient
      .get<ProjectBudgetDetailDto>(`${base(projectId)}/budget`, { params: slug() })
      .then((r) => r.data),

  getSettlement: (projectId) =>
    apiClient
      .get<ProjectSettlementDto>(`${base(projectId)}/settlement`, { params: slug() })
      .then((r) => r.data),

  createSection: (projectId, payload) =>
    apiClient
      .post<ProjectBudgetSectionDto>(`${base(projectId)}/budget/sections`, payload, { params: slug() })
      .then((r) => r.data),

  updateSection: (projectId, sectionId, payload) =>
    apiClient
      .patch<ProjectBudgetSectionDto>(`${base(projectId)}/budget/sections/${sectionId}`, payload, {
        params: slug(),
      })
      .then((r) => r.data),

  deleteSection: (projectId, sectionId) =>
    apiClient
      .delete(`${base(projectId)}/budget/sections/${sectionId}`, { params: slug() })
      .then(() => undefined),

  createLineItem: (projectId, payload) =>
    apiClient
      .post<ProjectBudgetLineItemDto>(`${base(projectId)}/budget/line-items`, payload, { params: slug() })
      .then((r) => r.data),

  updateLineItem: (projectId, lineItemId, payload) =>
    apiClient
      .patch<ProjectBudgetLineItemDto>(`${base(projectId)}/budget/line-items/${lineItemId}`, payload, {
        params: slug(),
      })
      .then((r) => r.data),

  deleteLineItem: (projectId, lineItemId) =>
    apiClient
      .delete(`${base(projectId)}/budget/line-items/${lineItemId}`, { params: slug() })
      .then(() => undefined),

  createSupplierPayment: (projectId, payload) =>
    apiClient
      .post<ProjectBudgetLineItemDto>(`${base(projectId)}/budget/supplier-payments`, payload, {
        params: slug(),
      })
      .then((r) => r.data),

  deleteSupplierPayment: (projectId, paymentId) =>
    apiClient
      .delete(`${base(projectId)}/budget/supplier-payments/${paymentId}`, { params: slug() })
      .then(() => undefined),

  fetchPdfHtml: (projectId) =>
    apiClient
      .get(`${base(projectId)}/budget/pdf`, {
        params: slug(),
        responseType: 'text',
      })
      .then((r) => String(r.data)),

  duplicateSnapshot: (projectId) =>
    apiClient
      .post<DuplicateBudgetSnapshotResult>(`${base(projectId)}/budget/duplicate-snapshot`, null, {
        params: slug(),
      })
      .then((r) => r.data),

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
    apiClient.get<{ url: string }>(`/gen-archivos/${attachmentId}/url`, { params: slug() }).then((r) => r.data.url),
}
