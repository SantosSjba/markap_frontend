import { projectBudgetRepositoryKey as repoKey } from '../../application/ports/project-budget.port'
import { useService } from '@shared/presentation/di/services'
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/vue-query'
import { computed, unref, type Ref } from 'vue'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { triggerBlobDownload } from '@shared/presentation/downloads/download-blob'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { invalidateModuleQueries } from '@shared/utils/invalidateModuleQueries'
import { INTERIORISMO_APP_SLUG } from '../../../../config/app.constants'
import { interiorProjectKeys } from '../../../proyectos/presentation/composables/useInteriorProjects'
import type { BudgetSheetDto } from '../../domain/project-budget.types'

export const projectBudgetKeys = {
  all: ['interiorismo-project-budget', INTERIORISMO_APP_SLUG] as const,
  budget: (projectId: string) => [...projectBudgetKeys.all, 'budget', projectId] as const,
  settlement: (projectId: string) => [...projectBudgetKeys.all, 'settlement', projectId] as const,
}

/**
 * La hoja que devuelve el servidor reemplaza la caché (sin volver a pedirla) y se refrescan
 * la liquidación y la ficha del proyecto, que dependen de los totales.
 */
export function applyBudgetSheet(qc: QueryClient, projectId: string, sheet: BudgetSheetDto) {
  qc.setQueryData(projectBudgetKeys.budget(projectId), sheet)
  void qc.invalidateQueries({ queryKey: projectBudgetKeys.settlement(projectId) })
  void qc.invalidateQueries({ queryKey: interiorProjectKeys.all })
}

export function useProjectBudget(projectId: Ref<string> | string) {
  const repo = useService(repoKey)
  const pid = () => unref(projectId)
  return useQuery({
    queryKey: computed(() => projectBudgetKeys.budget(pid())),
    queryFn: () => repo.getSheet(pid()),
    enabled: computed(() => !!pid()),
  })
}

export function useProjectSettlement(projectId: Ref<string> | string) {
  const repo = useService(repoKey)
  const pid = () => unref(projectId)
  return useQuery({
    queryKey: computed(() => projectBudgetKeys.settlement(pid())),
    queryFn: () => repo.getSettlement(pid()),
    enabled: computed(() => !!pid()),
  })
}

/** Acceso al repositorio para el editor (que encola sus propias llamadas). */
export function useBudgetRepository() {
  return useService(repoKey)
}

export function useOpenProjectBudgetPdf() {
  const repo = useService(repoKey)
  return async function openProjectBudgetPdf(projectId: string): Promise<void> {
    try {
      const html = await repo.fetchPdfHtml(projectId)
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank', 'noopener,noreferrer')
      window.setTimeout(() => URL.revokeObjectURL(url), 120_000)
      void markapAlert.toast.info('Use Imprimir → Guardar como PDF en el navegador.')
    } catch (err) {
      void markapAlert.toast.error('No se pudo abrir el presupuesto', getApiErrorMessage(err))
    }
  }
}

export function useExportBudgetExcel(projectId: Ref<string> | string) {
  const repo = useService(repoKey)
  return useMutation({
    mutationFn: async (fileName: string) => ({ blob: await repo.exportExcel(unref(projectId)), fileName }),
    onSuccess: ({ blob, fileName }) => triggerBlobDownload(blob, fileName),
    onError: (err) => void markapAlert.toast.error('No se pudo exportar', getApiErrorMessage(err)),
  })
}

export function useDuplicateBudgetSnapshot(projectId: Ref<string> | string) {
  const repo = useService(repoKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => repo.duplicateSnapshot(unref(projectId)),
    onSuccess: (sheet) => {
      applyBudgetSheet(qc, unref(projectId), sheet)
      void markapAlert.toast.success(`Versión ${sheet.budget.version} creada; la anterior queda guardada`)
    },
    onError: (err) =>
      void markapAlert.toast.error('No se pudo crear la versión', getApiErrorMessage(err)),
  })
}

export function useActivateBudgetVersion(projectId: Ref<string> | string) {
  const repo = useService(repoKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (budgetId: string) => repo.activateVersion(unref(projectId), budgetId),
    onSuccess: (sheet) => {
      applyBudgetSheet(qc, unref(projectId), sheet)
      void markapAlert.toast.success(`Ahora se trabaja la versión ${sheet.budget.version}`)
    },
    onError: (err) =>
      void markapAlert.toast.error('No se pudo cambiar de versión', getApiErrorMessage(err)),
  })
}

export function useSyncBudgetFromExecution(projectId: Ref<string> | string) {
  const repo = useService(repoKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => repo.syncFromExecution(unref(projectId)),
    onSuccess: (result) => {
      applyBudgetSheet(qc, unref(projectId), result.sheet)
      const extra =
        result.unmatchedConcepts.length > 0
          ? ` · ${result.unmatchedConcepts.length} concepto(s) sin partida coincidente`
          : ''
      void markapAlert.toast.success(`${result.updatedRows} partida(s) actualizada(s)${extra}`)
    },
    onError: (err) =>
      void markapAlert.toast.error('No se pudo sincronizar desde ejecución', getApiErrorMessage(err)),
  })
}

export function useImportBudgetExcel(projectId: Ref<string> | string) {
  const repo = useService(repoKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ file, replace }: { file: File; replace?: boolean }) =>
      repo.importExcel(unref(projectId), file, replace),
    onSuccess: (result) => {
      applyBudgetSheet(qc, unref(projectId), result)
      void markapAlert.toast.success(`Importadas ${result.rowsCreated} filas desde «${result.import.sheetName}»`)
    },
    onError: (err) =>
      void markapAlert.toast.error('No se pudo importar el Excel', getApiErrorMessage(err)),
  })
}

export function useProjectBudgetAttachments(
  projectId: Ref<string> | string,
  lineItemId?: Ref<string | null>,
) {
  const repo = useService(repoKey)
  const pid = () => unref(projectId)
  const lid = () => (lineItemId ? unref(lineItemId) : null)
  return useQuery({
    queryKey: computed(() => [...projectBudgetKeys.all, 'attachments', pid(), lid()] as const),
    queryFn: () => repo.listAttachments(pid(), lid() ?? undefined),
    enabled: computed(() => !!pid()),
  })
}

export function useUploadBudgetAttachment(projectId: Ref<string> | string) {
  const repo = useService(repoKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ file, lineItemId }: { file: File; lineItemId?: string | null }) =>
      repo.uploadAttachment(unref(projectId), file, { lineItemId }),
    onSuccess: async () => {
      await invalidateModuleQueries(qc, 'interiorismo')
      void markapAlert.toast.success('Adjunto subido')
    },
    onError: (err) =>
      void markapAlert.toast.error('No se pudo subir el adjunto', getApiErrorMessage(err)),
  })
}

export function useDeleteBudgetAttachment(projectId: Ref<string> | string) {
  const repo = useService(repoKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (attachmentId: string) => repo.deleteAttachment(unref(projectId), attachmentId),
    onSuccess: async () => {
      await invalidateModuleQueries(qc, 'interiorismo')
      void markapAlert.toast.success('Adjunto eliminado')
    },
    onError: (err) => void markapAlert.toast.error('No se pudo eliminar', getApiErrorMessage(err)),
  })
}
