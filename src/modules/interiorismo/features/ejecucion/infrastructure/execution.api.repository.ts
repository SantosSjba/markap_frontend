import { apiClient } from '@core/api/apiClient'
import { INTERIORISMO_APP_SLUG } from '@modules/interiorismo/config/app.constants'
import type { InteriorExecutionRepository } from '../domain/repositories/execution.repository'
import type {
  CreateExecutionActualCostPayload,
  CreateExecutionEvidencePayload,
  CreateExecutionIncidentPayload,
  CreateExecutionTaskPayload,
  InteriorExecutionEvidenceDto,
  InteriorExecutionIncidentDto,
  InteriorExecutionOverviewDto,
  InteriorExecutionTaskDto,
  UpdateExecutionIncidentPayload,
  UpdateExecutionTaskPayload,
  UploadExecutionEvidencePayload,
} from '../domain/execution.types'

const BASE = '/interiorismo-execution'

const q = () => ({ params: { applicationSlug: INTERIORISMO_APP_SLUG } })

export const interiorExecutionApiRepository: InteriorExecutionRepository = {
  getOverview: (projectId: string) =>
    apiClient
      .get<InteriorExecutionOverviewDto>(`${BASE}/projects/${projectId}/overview`, q())
      .then((r) => r.data),

  patchProgress: (projectId: string, progressPct: number) =>
    apiClient
      .patch(`${BASE}/projects/${projectId}/progress`, { progressPct }, q())
      .then((r) => r.data),

  createTask: (projectId: string, payload: CreateExecutionTaskPayload) =>
    apiClient
      .post<InteriorExecutionTaskDto>(`${BASE}/projects/${projectId}/tasks`, payload, q())
      .then((r) => r.data),

  updateTask: (projectId: string, taskId: string, payload: UpdateExecutionTaskPayload) =>
    apiClient
      .patch<InteriorExecutionTaskDto>(`${BASE}/projects/${projectId}/tasks/${taskId}`, payload, q())
      .then((r) => r.data),

  deleteTask: (projectId: string, taskId: string) =>
    apiClient.delete(`${BASE}/projects/${projectId}/tasks/${taskId}`, q()).then(() => undefined),

  createEvidence: (projectId: string, payload: CreateExecutionEvidencePayload) =>
    apiClient
      .post<InteriorExecutionEvidenceDto>(`${BASE}/projects/${projectId}/evidences`, payload, q())
      .then((r) => r.data),

  uploadEvidence: (projectId: string, payload: UploadExecutionEvidencePayload) => {
    const fd = new FormData()
    fd.append('file', payload.file)
    fd.append('kind', payload.kind)
    fd.append('title', payload.title)
    fd.append('capturedAt', payload.capturedAt)
    if (payload.taskId) fd.append('taskId', payload.taskId)
    return apiClient
      .post<InteriorExecutionEvidenceDto>(`${BASE}/projects/${projectId}/evidences/upload`, fd, {
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
      .post<InteriorExecutionIncidentDto>(`${BASE}/projects/${projectId}/incidents`, payload, q())
      .then((r) => r.data),

  updateIncident: (projectId: string, incidentId: string, payload: UpdateExecutionIncidentPayload) =>
    apiClient
      .patch<InteriorExecutionIncidentDto>(
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
