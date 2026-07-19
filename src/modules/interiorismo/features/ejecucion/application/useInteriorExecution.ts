import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, unref, type Ref } from 'vue'
import { markapAlert } from '@/shared/composables'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import { invalidateQuerySubtree } from '@/shared/utils/invalidateQuerySubtree'
import { INTERIORISMO_APP_SLUG } from '@modules/interiorismo/config/app.constants'
import { interiorProjectKeys } from '@modules/interiorismo/features/proyectos/application/useInteriorProjects'
import type {
  CreateExecutionActualCostPayload,
  CreateExecutionEvidencePayload,
  CreateExecutionIncidentPayload,
  CreateExecutionTaskPayload,
  UpdateExecutionIncidentPayload,
  UpdateExecutionTaskPayload,
  UploadExecutionEvidencePayload,
} from '../domain/execution.types'
import { interiorExecutionApiRepository as repo } from '../infrastructure/execution.api.repository'

export const interiorExecutionKeys = {
  all: ['interiorismo-execution', INTERIORISMO_APP_SLUG] as const,
  overview: (projectId: string) => [...interiorExecutionKeys.all, 'overview', projectId] as const,
}

export function useInteriorExecutionOverview(projectId: Ref<string> | string) {
  const pid = () => unref(projectId)
  return useQuery({
    queryKey: computed(() => interiorExecutionKeys.overview(pid())),
    queryFn: () => repo.getOverview(pid()),
    enabled: computed(() => !!pid()),
  })
}

export function usePatchExecutionProgress(projectId: Ref<string> | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (progressPct: number) => repo.patchProgress(unref(projectId), progressPct),
    onSuccess: () => {
      const id = unref(projectId)
      qc.invalidateQueries({ queryKey: interiorExecutionKeys.overview(id) })
      invalidateQuerySubtree(qc, interiorProjectKeys.detail(id))
      invalidateQuerySubtree(qc, interiorProjectKeys.all)
      void markapAlert.toast.success('Avance actualizado')
    },
    onError: (err) => void markapAlert.toast.error('No se pudo guardar el avance', getApiErrorMessage(err)),
  })
}

export function useCreateExecutionTask(projectId: Ref<string> | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateExecutionTaskPayload) => repo.createTask(unref(projectId), payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: interiorExecutionKeys.overview(unref(projectId)) })
      void markapAlert.toast.success('Tarea creada')
    },
    onError: (err) => void markapAlert.toast.error('No se pudo crear la tarea', getApiErrorMessage(err)),
  })
}

export function useUpdateExecutionTask(projectId: Ref<string> | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ taskId, payload }: { taskId: string; payload: UpdateExecutionTaskPayload }) =>
      repo.updateTask(unref(projectId), taskId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: interiorExecutionKeys.overview(unref(projectId)) })
      void markapAlert.toast.success('Tarea actualizada')
    },
    onError: (err) => void markapAlert.toast.error('No se pudo actualizar', getApiErrorMessage(err)),
  })
}

export function useDeleteExecutionTask(projectId: Ref<string> | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (taskId: string) => repo.deleteTask(unref(projectId), taskId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: interiorExecutionKeys.overview(unref(projectId)) })
      void markapAlert.toast.success('Tarea eliminada')
    },
    onError: (err) => void markapAlert.toast.error('No se pudo eliminar', getApiErrorMessage(err)),
  })
}

export function useCreateExecutionEvidence(projectId: Ref<string> | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateExecutionEvidencePayload) =>
      repo.createEvidence(unref(projectId), payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: interiorExecutionKeys.overview(unref(projectId)) })
      void markapAlert.toast.success('Evidencia registrada')
    },
    onError: (err) => void markapAlert.toast.error('No se pudo registrar', getApiErrorMessage(err)),
  })
}

export function useUploadExecutionEvidence(projectId: Ref<string> | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UploadExecutionEvidencePayload) =>
      repo.uploadEvidence(unref(projectId), payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: interiorExecutionKeys.overview(unref(projectId)) })
      void markapAlert.toast.success('Evidencia subida')
    },
    onError: (err) => void markapAlert.toast.error('No se pudo subir la evidencia', getApiErrorMessage(err)),
  })
}

export async function openExecutionEvidenceFile(row: {
  archivoId: string | null
  downloadUrl?: string | null
  fileUrl: string
}) {
  try {
    if (row.archivoId) {
      const url = await repo.getDownloadUrl(row.archivoId)
      window.open(url, '_blank', 'noopener,noreferrer')
      return
    }
    const url = row.downloadUrl || row.fileUrl
    if (url && /^https?:\/\//i.test(url)) {
      window.open(url, '_blank', 'noopener,noreferrer')
      return
    }
    void markapAlert.toast.error('No hay archivo disponible')
  } catch {
    void markapAlert.toast.error('No se pudo abrir el archivo')
  }
}

export function useDeleteExecutionEvidence(projectId: Ref<string> | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (evidenceId: string) => repo.deleteEvidence(unref(projectId), evidenceId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: interiorExecutionKeys.overview(unref(projectId)) })
      void markapAlert.toast.success('Evidencia eliminada')
    },
    onError: (err) => void markapAlert.toast.error('No se pudo eliminar', getApiErrorMessage(err)),
  })
}

export function useCreateExecutionIncident(projectId: Ref<string> | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateExecutionIncidentPayload) =>
      repo.createIncident(unref(projectId), payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: interiorExecutionKeys.overview(unref(projectId)) })
      void markapAlert.toast.success('Incidencia registrada')
    },
    onError: (err) => void markapAlert.toast.error('No se pudo registrar', getApiErrorMessage(err)),
  })
}

export function useUpdateExecutionIncident(projectId: Ref<string> | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ incidentId, payload }: { incidentId: string; payload: UpdateExecutionIncidentPayload }) =>
      repo.updateIncident(unref(projectId), incidentId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: interiorExecutionKeys.overview(unref(projectId)) })
      void markapAlert.toast.success('Incidencia actualizada')
    },
    onError: (err) => void markapAlert.toast.error('No se pudo actualizar', getApiErrorMessage(err)),
  })
}

export function useCreateExecutionActualCost(projectId: Ref<string> | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateExecutionActualCostPayload) =>
      repo.createActualCost(unref(projectId), payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: interiorExecutionKeys.overview(unref(projectId)) })
      void markapAlert.toast.success('Costo registrado')
    },
    onError: (err) => void markapAlert.toast.error('No se pudo registrar el costo', getApiErrorMessage(err)),
  })
}

export function useDeleteExecutionActualCost(projectId: Ref<string> | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (costId: string) => repo.deleteActualCost(unref(projectId), costId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: interiorExecutionKeys.overview(unref(projectId)) })
      void markapAlert.toast.success('Costo eliminado')
    },
    onError: (err) => void markapAlert.toast.error('No se pudo eliminar', getApiErrorMessage(err)),
  })
}
