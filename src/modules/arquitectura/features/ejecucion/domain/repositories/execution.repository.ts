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
} from '../execution.types'

export interface ArquitecturaExecutionRepository {
  getOverview(projectId: string): Promise<ArquitecturaExecutionOverviewDto>
  patchProgress(projectId: string, progressPct: number): Promise<unknown>
  createTask(projectId: string, payload: CreateExecutionTaskPayload): Promise<ArquitecturaExecutionTaskDto>
  updateTask(
    projectId: string,
    taskId: string,
    payload: UpdateExecutionTaskPayload,
  ): Promise<ArquitecturaExecutionTaskDto>
  deleteTask(projectId: string, taskId: string): Promise<void>
  createEvidence(projectId: string, payload: CreateExecutionEvidencePayload): Promise<ArquitecturaExecutionEvidenceDto>
  uploadEvidence(projectId: string, payload: UploadExecutionEvidencePayload): Promise<ArquitecturaExecutionEvidenceDto>
  deleteEvidence(projectId: string, evidenceId: string): Promise<void>
  createIncident(projectId: string, payload: CreateExecutionIncidentPayload): Promise<ArquitecturaExecutionIncidentDto>
  updateIncident(
    projectId: string,
    incidentId: string,
    payload: UpdateExecutionIncidentPayload,
  ): Promise<ArquitecturaExecutionIncidentDto>
  createActualCost(projectId: string, payload: CreateExecutionActualCostPayload): Promise<unknown>
  deleteActualCost(projectId: string, costId: string): Promise<void>
  getDownloadUrl(archivoId: string): Promise<string>
}
