import { apiClient } from '@core/api/apiClient'
import { ARQUITECTURA_APP_SLUG } from '@modules/arquitectura/config/app.constants'
import type { ArquitecturaExecutionRepository } from '../domain/repositories/execution.repository'
import type {
  CreateExecutionActualCostPayload,
  CreateExecutionEvidencePayload,
  CreateExecutionIncidentPayload,
  CreateExecutionTaskPayload,
  ArquitecturaExecutionEvidenceDto,
  ArquitecturaExecutionIncidentDto,
  ArquitecturaExecutionOverviewDto,
  ArquitecturaExecutionTaskDto,
  UpdateExecutionIncidentPayload,
  UpdateExecutionTaskPayload,
  UploadExecutionEvidencePayload,
} from '../domain/execution.types'

const BASE = '/arquitectura-execution'

const q = () => ({ params: { applicationSlug: ARQUITECTURA_APP_SLUG } })

export const arquitecturaExecutionApiRepository: ArquitecturaExecutionRepository = {
  getOverview: (projectId: string) =>
    apiClient
      .get<ArquitecturaExecutionOverviewDto>(`${BASE}/projects/${projectId}/overview`, q())
      .then((r) => r.data),

  patchProgress: (projectId: string, progressPct: number) =>
    apiClient
      .patch(`${BASE}/projects/${projectId}/progress`, { progressPct }, q())
      .then((r) => r.data),

  createTask: (projectId: string, payload: CreateExecutionTaskPayload) =>
    apiClient
      .post<ArquitecturaExecutionTaskDto>(`${BASE}/projects/${projectId}/tasks`, payload, q())
      .then((r) => r.data),

  updateTask: (projectId: string, taskId: string, payload: UpdateExecutionTaskPayload) =>
    apiClient
      .patch<ArquitecturaExecutionTaskDto>(`${BASE}/projects/${projectId}/tasks/${taskId}`, payload, q())
      .then((r) => r.data),

  deleteTask: (projectId: string, taskId: string) =>
    apiClient.delete(`${BASE}/projects/${projectId}/tasks/${taskId}`, q()).then(() => undefined),

  createEvidence: (projectId: string, payload: CreateExecutionEvidencePayload) =>
    apiClient
      .post<ArquitecturaExecutionEvidenceDto>(`${BASE}/projects/${projectId}/evidences`, payload, q())
      .then((r) => r.data),

  uploadEvidence: (projectId: string, payload: UploadExecutionEvidencePayload) => {
    const fd = new FormData()
    fd.append('file', payload.file)
    fd.append('kind', payload.kind)
    fd.append('title', payload.title)
    fd.append('capturedAt', payload.capturedAt)
    if (payload.taskId) fd.append('taskId', payload.taskId)
    return apiClient
      .post<ArquitecturaExecutionEvidenceDto>(`${BASE}/projects/${projectId}/evidences/upload`, fd, {
        ...q(),
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },

  deleteEvidence: (projectId: string, evidenceId: string) =>
    apiClient
      .delete(`${BASE}/projects/${projectId}/evidences/${evidenceId}`, q())
      .then(() => undefined),

  createIncident: (projectId: string, payload: CreateExecutionIncidentPayload) =>
    apiClient
      .post<ArquitecturaExecutionIncidentDto>(`${BASE}/projects/${projectId}/incidents`, payload, q())
      .then((r) => r.data),

  updateIncident: (projectId: string, incidentId: string, payload: UpdateExecutionIncidentPayload) =>
    apiClient
      .patch<ArquitecturaExecutionIncidentDto>(
        `${BASE}/projects/${projectId}/incidents/${incidentId}`,
        payload,
        q(),
      )
      .then((r) => r.data),

  createActualCost: (projectId: string, payload: CreateExecutionActualCostPayload) =>
    apiClient
      .post(`${BASE}/projects/${projectId}/actual-costs`, payload, q())
      .then((r) => r.data),

  deleteActualCost: (projectId: string, costId: string) =>
    apiClient
      .delete(`${BASE}/projects/${projectId}/actual-costs/${costId}`, q())
      .then(() => undefined),

  getDownloadUrl: (archivoId: string) =>
    apiClient
      .get<{ url: string }>(`/gen-archivos/${archivoId}/url`, q())
      .then((r) => r.data.url),
}
