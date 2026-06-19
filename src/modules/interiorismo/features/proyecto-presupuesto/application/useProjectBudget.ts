import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, unref, type Ref } from 'vue'
import { markapAlert } from '@/shared/composables'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import { invalidateQuerySubtree } from '@/shared/utils/invalidateQuerySubtree'
import { INTERIORISMO_APP_SLUG } from '@modules/interiorismo/config/app.constants'
import { interiorProjectKeys } from '@modules/interiorismo/features/proyectos/application/useInteriorProjects'
import type {
  CreateLineItemSupplierPaymentPayload,
  CreateProjectBudgetLineItemPayload,
  CreateProjectBudgetSectionPayload,
  UpdateProjectBudgetLineItemPayload,
  UpdateProjectBudgetSectionPayload,
} from '../domain/project-budget.types'
import { projectBudgetApiRepository as repo } from '../infrastructure/project-budget.api.repository'

export const projectBudgetKeys = {
  all: ['interiorismo-project-budget', INTERIORISMO_APP_SLUG] as const,
  budget: (projectId: string) => [...projectBudgetKeys.all, 'budget', projectId] as const,
  settlement: (projectId: string) => [...projectBudgetKeys.all, 'settlement', projectId] as const,
}

function invalidateBudget(qc: ReturnType<typeof useQueryClient>, projectId: string) {
  qc.invalidateQueries({ queryKey: projectBudgetKeys.budget(projectId) })
  qc.invalidateQueries({ queryKey: projectBudgetKeys.settlement(projectId) })
  invalidateQuerySubtree(qc, interiorProjectKeys.detail(projectId))
}

export function useProjectBudget(projectId: Ref<string> | string) {
  const pid = () => unref(projectId)
  return useQuery({
    queryKey: computed(() => projectBudgetKeys.budget(pid())),
    queryFn: () => repo.getBudget(pid()),
    enabled: computed(() => !!pid()),
  })
}

export function useProjectSettlement(projectId: Ref<string> | string) {
  const pid = () => unref(projectId)
  return useQuery({
    queryKey: computed(() => projectBudgetKeys.settlement(pid())),
    queryFn: () => repo.getSettlement(pid()),
    enabled: computed(() => !!pid()),
  })
}

export function useCreateBudgetSection(projectId: Ref<string> | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateProjectBudgetSectionPayload) => repo.createSection(unref(projectId), payload),
    onSuccess: () => {
      invalidateBudget(qc, unref(projectId))
      void markapAlert.toast.success('Sección creada')
    },
    onError: (err) => void markapAlert.toast.error('No se pudo crear la sección', getApiErrorMessage(err)),
  })
}

export function useUpdateBudgetSection(projectId: Ref<string> | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ sectionId, payload }: { sectionId: string; payload: UpdateProjectBudgetSectionPayload }) =>
      repo.updateSection(unref(projectId), sectionId, payload),
    onSuccess: () => {
      invalidateBudget(qc, unref(projectId))
      void markapAlert.toast.success('Sección actualizada')
    },
    onError: (err) => void markapAlert.toast.error('No se pudo actualizar', getApiErrorMessage(err)),
  })
}

export function useDeleteBudgetSection(projectId: Ref<string> | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (sectionId: string) => repo.deleteSection(unref(projectId), sectionId),
    onSuccess: () => {
      invalidateBudget(qc, unref(projectId))
      void markapAlert.toast.success('Sección eliminada')
    },
    onError: (err) => void markapAlert.toast.error('No se pudo eliminar', getApiErrorMessage(err)),
  })
}

export function useCreateBudgetLineItem(projectId: Ref<string> | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateProjectBudgetLineItemPayload) => repo.createLineItem(unref(projectId), payload),
    onSuccess: () => {
      invalidateBudget(qc, unref(projectId))
      void markapAlert.toast.success('Partida agregada')
    },
    onError: (err) => void markapAlert.toast.error('No se pudo agregar la partida', getApiErrorMessage(err)),
  })
}

export function useUpdateBudgetLineItem(projectId: Ref<string> | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ lineItemId, payload }: { lineItemId: string; payload: UpdateProjectBudgetLineItemPayload }) =>
      repo.updateLineItem(unref(projectId), lineItemId, payload),
    onSuccess: () => {
      invalidateBudget(qc, unref(projectId))
      void markapAlert.toast.success('Partida actualizada')
    },
    onError: (err) => void markapAlert.toast.error('No se pudo actualizar', getApiErrorMessage(err)),
  })
}

export function useDeleteBudgetLineItem(projectId: Ref<string> | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (lineItemId: string) => repo.deleteLineItem(unref(projectId), lineItemId),
    onSuccess: () => {
      invalidateBudget(qc, unref(projectId))
      void markapAlert.toast.success('Partida eliminada')
    },
    onError: (err) => void markapAlert.toast.error('No se pudo eliminar', getApiErrorMessage(err)),
  })
}

export function useCreateSupplierPayment(projectId: Ref<string> | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateLineItemSupplierPaymentPayload) =>
      repo.createSupplierPayment(unref(projectId), payload),
    onSuccess: () => {
      invalidateBudget(qc, unref(projectId))
      void markapAlert.toast.success('Abono registrado')
    },
    onError: (err) => void markapAlert.toast.error('No se pudo registrar el abono', getApiErrorMessage(err)),
  })
}

export function useDeleteSupplierPayment(projectId: Ref<string> | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (paymentId: string) => repo.deleteSupplierPayment(unref(projectId), paymentId),
    onSuccess: () => {
      invalidateBudget(qc, unref(projectId))
      void markapAlert.toast.success('Abono eliminado')
    },
    onError: (err) => void markapAlert.toast.error('No se pudo eliminar', getApiErrorMessage(err)),
  })
}

export async function openProjectBudgetPdf(projectId: string): Promise<void> {
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

export function useDuplicateBudgetSnapshot(projectId: Ref<string> | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => repo.duplicateSnapshot(unref(projectId)),
    onSuccess: (result) => {
      invalidateBudget(qc, unref(projectId))
      void markapAlert.toast.success(
        `Snapshot creado: ${result.sectionsCreated} secciones, ${result.lineItemsCreated} partidas`,
      )
    },
    onError: (err) =>
      void markapAlert.toast.error('No se pudo duplicar el presupuesto', getApiErrorMessage(err)),
  })
}

export function useSyncBudgetFromExecution(projectId: Ref<string> | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => repo.syncFromExecution(unref(projectId)),
    onSuccess: (result) => {
      invalidateBudget(qc, unref(projectId))
      const extra =
        result.unmatchedConcepts.length > 0
          ? ` · ${result.unmatchedConcepts.length} concepto(s) sin partida coincidente`
          : ''
      void markapAlert.toast.success(`${result.updatedLineItems} partida(s) actualizada(s)${extra}`)
    },
    onError: (err) =>
      void markapAlert.toast.error('No se pudo sincronizar desde ejecución', getApiErrorMessage(err)),
  })
}

export function useImportBudgetExcel(projectId: Ref<string> | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ file, replace }: { file: File; replace?: boolean }) =>
      repo.importExcel(unref(projectId), file, replace),
    onSuccess: (result) => {
      invalidateBudget(qc, unref(projectId))
      void markapAlert.toast.success(
        `Importado: ${result.sectionsCreated} secciones, ${result.lineItemsCreated} partidas`,
      )
    },
    onError: (err) =>
      void markapAlert.toast.error('No se pudo importar el Excel', getApiErrorMessage(err)),
  })
}

export function useProjectBudgetAttachments(projectId: Ref<string> | string, lineItemId?: Ref<string | null>) {
  const pid = () => unref(projectId)
  const lid = () => (lineItemId ? unref(lineItemId) : null)
  return useQuery({
    queryKey: computed(() => [...projectBudgetKeys.all, 'attachments', pid(), lid()] as const),
    queryFn: () => repo.listAttachments(pid(), lid() ?? undefined),
    enabled: computed(() => !!pid()),
  })
}

export function useUploadBudgetAttachment(projectId: Ref<string> | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ file, lineItemId }: { file: File; lineItemId?: string | null }) =>
      repo.uploadAttachment(unref(projectId), file, { lineItemId }),
    onSuccess: () => {
      invalidateQuerySubtree(qc, projectBudgetKeys.all)
      void markapAlert.toast.success('Adjunto subido')
    },
    onError: (err) => void markapAlert.toast.error('No se pudo subir el adjunto', getApiErrorMessage(err)),
  })
}

export function useDeleteBudgetAttachment(projectId: Ref<string> | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (attachmentId: string) => repo.deleteAttachment(unref(projectId), attachmentId),
    onSuccess: () => {
      invalidateQuerySubtree(qc, projectBudgetKeys.all)
      void markapAlert.toast.success('Adjunto eliminado')
    },
    onError: (err) => void markapAlert.toast.error('No se pudo eliminar', getApiErrorMessage(err)),
  })
}
