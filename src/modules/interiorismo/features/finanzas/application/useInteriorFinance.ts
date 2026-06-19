import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, unref, type Ref } from 'vue'
import { markapAlert } from '@/shared/composables'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import { invalidateQuerySubtree } from '@/shared/utils/invalidateQuerySubtree'
import { INTERIORISMO_APP_SLUG } from '@modules/interiorismo/config/app.constants'
import { interiorProjectKeys } from '@modules/interiorismo/features/proyectos/application/useInteriorProjects'
import { projectBudgetKeys } from '@modules/interiorismo/features/proyecto-presupuesto/application/useProjectBudget'
import type {
  CreateFinancePaymentPayload,
  CreateFinanceSchedulePayload,
  UpdateFinancePaymentPayload,
  UpdateFinanceSchedulePayload,
} from '../domain/finance.types'
import { interiorFinanceApiRepository as repo } from '../infrastructure/finance.api.repository'

export const interiorFinanceKeys = {
  all: ['interiorismo-finance', INTERIORISMO_APP_SLUG] as const,
  overview: (projectId: string) => [...interiorFinanceKeys.all, 'overview', projectId] as const,
}

function invalidateFinance(qc: ReturnType<typeof useQueryClient>, projectId: string) {
  qc.invalidateQueries({ queryKey: interiorFinanceKeys.overview(projectId) })
  qc.invalidateQueries({ queryKey: projectBudgetKeys.settlement(projectId) })
  invalidateQuerySubtree(qc, interiorProjectKeys.detail(projectId))
  invalidateQuerySubtree(qc, interiorProjectKeys.all)
}

export function useInteriorFinanceOverview(projectId: Ref<string> | string) {
  const pid = () => unref(projectId)
  return useQuery({
    queryKey: computed(() => interiorFinanceKeys.overview(pid())),
    queryFn: () => repo.getOverview(pid()),
    enabled: computed(() => !!pid()),
  })
}

export function useCreateFinanceSchedule(projectId: Ref<string> | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateFinanceSchedulePayload) => repo.createSchedule(unref(projectId), payload),
    onSuccess: () => {
      invalidateFinance(qc, unref(projectId))
      void markapAlert.toast.success('Programación registrada')
    },
    onError: (err) => void markapAlert.toast.error('No se pudo guardar', getApiErrorMessage(err)),
  })
}

export function useUpdateFinanceSchedule(projectId: Ref<string> | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ scheduleId, payload }: { scheduleId: string; payload: UpdateFinanceSchedulePayload }) =>
      repo.updateSchedule(unref(projectId), scheduleId, payload),
    onSuccess: () => {
      invalidateFinance(qc, unref(projectId))
      void markapAlert.toast.success('Actualizado')
    },
    onError: (err) => void markapAlert.toast.error('No se pudo actualizar', getApiErrorMessage(err)),
  })
}

export function useDeleteFinanceSchedule(projectId: Ref<string> | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (scheduleId: string) => repo.deleteSchedule(unref(projectId), scheduleId),
    onSuccess: () => {
      invalidateFinance(qc, unref(projectId))
      void markapAlert.toast.success('Eliminado')
    },
    onError: (err) => void markapAlert.toast.error('No se pudo eliminar', getApiErrorMessage(err)),
  })
}

export function useCreateFinancePayment(projectId: Ref<string> | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateFinancePaymentPayload) => repo.createPayment(unref(projectId), payload),
    onSuccess: () => {
      invalidateFinance(qc, unref(projectId))
      void markapAlert.toast.success('Pago registrado')
    },
    onError: (err) => void markapAlert.toast.error('No se pudo registrar el pago', getApiErrorMessage(err)),
  })
}

export function useUpdateFinancePayment(projectId: Ref<string> | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ paymentId, payload }: { paymentId: string; payload: UpdateFinancePaymentPayload }) =>
      repo.updatePayment(unref(projectId), paymentId, payload),
    onSuccess: () => {
      invalidateFinance(qc, unref(projectId))
      void markapAlert.toast.success('Pago actualizado')
    },
    onError: (err) => void markapAlert.toast.error('No se pudo actualizar', getApiErrorMessage(err)),
  })
}

export function useDeleteFinancePayment(projectId: Ref<string> | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (paymentId: string) => repo.deletePayment(unref(projectId), paymentId),
    onSuccess: () => {
      invalidateFinance(qc, unref(projectId))
      void markapAlert.toast.success('Pago eliminado')
    },
    onError: (err) => void markapAlert.toast.error('No se pudo eliminar', getApiErrorMessage(err)),
  })
}
