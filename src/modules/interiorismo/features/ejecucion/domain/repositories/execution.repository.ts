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
} from '../execution.types'

export interface InteriorExecutionRepository {
  getOverview(projectId: string): Promise<InteriorExecutionOverviewDto>
  patchProgress(projectId: string, progressPct: number): Promise<unknown>
  createTask(projectId: string, payload: CreateExecutionTaskPayload): Promise<InteriorExecutionTaskDto>
  updateTask(
    projectId: string,
    taskId: string,
    payload: UpdateExecutionTaskPayload,
  ): Promise<InteriorExecutionTaskDto>
  deleteTask(projectId: string, taskId: string): Promise<void>
  createEvidence(projectId: string, payload: CreateExecutionEvidencePayload): Promise<InteriorExecutionEvidenceDto>
  deleteEvidence(projectId: string, evidenceId: string): Promise<void>
  createIncident(projectId: string, payload: CreateExecutionIncidentPayload): Promise<InteriorExecutionIncidentDto>
  updateIncident(
    projectId: string,
    incidentId: string,
    payload: UpdateExecutionIncidentPayload,
  ): Promise<InteriorExecutionIncidentDto>
  createActualCost(projectId: string, payload: CreateExecutionActualCostPayload): Promise<unknown>
  deleteActualCost(projectId: string, costId: string): Promise<void>
}
