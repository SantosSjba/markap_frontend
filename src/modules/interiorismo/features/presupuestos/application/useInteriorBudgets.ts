import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, unref, type Ref } from 'vue'
import { markapAlert } from '@/shared/composables'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import { invalidateQuerySubtree } from '@/shared/utils/invalidateQuerySubtree'
import { INTERIORISMO_APP_SLUG } from '@modules/interiorismo/config/app.constants'
import type {
  CreateInteriorBudgetPayload,
  ListInteriorBudgetsParams,
  UpdateInteriorBudgetPayload,
} from '../domain/budget.types'
import { interiorBudgetsApiRepository as repo } from '../infrastructure/budgets.api.repository'

export const interiorBudgetKeys = {
  all: ['interiorismo-budgets', INTERIORISMO_APP_SLUG] as const,
  list: (p: ListInteriorBudgetsParams) => [...interiorBudgetKeys.all, 'list', p] as const,
  detail: (id: string) => [...interiorBudgetKeys.all, 'detail', id] as const,
}

export async function openInteriorBudgetPdf(id: string): Promise<void> {
  try {
    const html = await repo.fetchPdfHtml(id)
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank', 'noopener,noreferrer')
    window.setTimeout(() => URL.revokeObjectURL(url), 120_000)
  } catch (err) {
    void markapAlert.toast.error('No se pudo abrir el PDF', getApiErrorMessage(err))
  }
}

export function useInteriorBudgetsList(params: Ref<ListInteriorBudgetsParams>) {
  return useQuery({
    queryKey: computed(() => interiorBudgetKeys.list(params.value)),
    queryFn: () => repo.getList(params.value),
  })
}

export function useInteriorBudgetDetail(id: Ref<string> | string) {
  return useQuery({
    queryKey: computed(() => interiorBudgetKeys.detail(unref(id))),
    queryFn: () => repo.getById(unref(id)),
    enabled: computed(() => !!unref(id)),
  })
}

export function useCreateInteriorBudget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateInteriorBudgetPayload) => repo.create(payload),
    onSuccess: () => {
      invalidateQuerySubtree(qc, interiorBudgetKeys.all)
      void markapAlert.toast.success('Presupuesto creado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo crear el presupuesto', getApiErrorMessage(err))
    },
  })
}

export function useUpdateInteriorBudget(id: Ref<string> | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateInteriorBudgetPayload) => repo.update(unref(id), payload),
    onSuccess: () => {
      invalidateQuerySubtree(qc, interiorBudgetKeys.all)
      void markapAlert.toast.success('Presupuesto guardado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo guardar', getApiErrorMessage(err))
    },
  })
}

export function useDuplicateInteriorBudget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (budgetId: string) => repo.duplicate(budgetId),
    onSuccess: () => {
      invalidateQuerySubtree(qc, interiorBudgetKeys.all)
      void markapAlert.toast.success('Nueva versión creada')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo duplicar', getApiErrorMessage(err))
    },
  })
}

export function useAddInteriorBudgetComment(id: Ref<string> | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: string) => repo.addComment(unref(id), body),
    onSuccess: () => {
      invalidateQuerySubtree(qc, interiorBudgetKeys.all)
      void markapAlert.toast.success('Comentario publicado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo publicar', getApiErrorMessage(err))
    },
  })
}

export function useAddInteriorBudgetAttachment(id: Ref<string> | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (p: { title: string; fileUrl: string }) =>
      repo.addAttachment(unref(id), p.title, p.fileUrl),
    onSuccess: () => {
      invalidateQuerySubtree(qc, interiorBudgetKeys.all)
      void markapAlert.toast.success('Adjunto registrado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo registrar el adjunto', getApiErrorMessage(err))
    },
  })
}
