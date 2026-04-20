import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/vue-query'
import { computed, unref, type Ref } from 'vue'
import { markapAlert } from '@/shared/alert'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import { ventasSalesService } from '../services/ventasSales.service'

export const ventasSalesKeys = {
  root: ['ventas-sales'] as const,
  processes: (params: object) => [...ventasSalesKeys.root, 'processes', params] as const,
  processDetail: (id: string) => [...ventasSalesKeys.root, 'process', id] as const,
  separations: (params: object) => [...ventasSalesKeys.root, 'separations', params] as const,
  closings: (params: object) => [...ventasSalesKeys.root, 'closings', params] as const,
}

function invalidateVentasFollowUpQueries(qc: QueryClient, processId: string) {
  void qc.invalidateQueries({ queryKey: ventasSalesKeys.processDetail(processId) })
  void qc.invalidateQueries({ queryKey: [...ventasSalesKeys.root, 'pipeline-board'] })
}

export function useVentasProcessesList(
  params: Ref<{
    page: number
    limit: number
    search?: string
    pipelineStage?: string
    status?: string
  }>,
) {
  return useQuery({
    queryKey: computed(() => ventasSalesKeys.processes(params.value)),
    queryFn: () => ventasSalesService.listProcesses(params.value),
  })
}

export function useVentasProcessDetail(id: Ref<string> | string) {
  return useQuery({
    queryKey: computed(() => ventasSalesKeys.processDetail(unref(id))),
    queryFn: () => ventasSalesService.getProcess(unref(id)),
    enabled: computed(() => !!unref(id)),
  })
}

export function useVentasCreateProcess() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ventasSalesService.createProcess,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ventasSalesKeys.root })
      void markapAlert.toast.success('Proceso creado')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo crear', getApiErrorMessage(e)),
  })
}

export function useVentasUpdateProcess() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof ventasSalesService.updateProcess>[1] }) =>
      ventasSalesService.updateProcess(id, body),
    onSuccess: (_, { id }) => {
      void qc.invalidateQueries({ queryKey: ventasSalesKeys.root })
      void qc.invalidateQueries({ queryKey: ventasSalesKeys.processDetail(id) })
      void markapAlert.toast.success('Proceso actualizado')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo guardar', getApiErrorMessage(e)),
  })
}

/** Actualizar etapa/estado sin toast de éxito (arrastre en pipeline Kanban). */
export function useVentasUpdateProcessQuiet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof ventasSalesService.updateProcess>[1] }) =>
      ventasSalesService.updateProcess(id, body),
    onSuccess: (_, { id }) => {
      void qc.invalidateQueries({ queryKey: ventasSalesKeys.root })
      void qc.invalidateQueries({ queryKey: ventasSalesKeys.processDetail(id) })
    },
    onError: (e) => void markapAlert.toast.error('No se pudo mover la tarjeta', getApiErrorMessage(e)),
  })
}

export function useVentasPipelineBoard() {
  return useQuery({
    queryKey: [...ventasSalesKeys.root, 'pipeline-board', 'active'] as const,
    queryFn: () =>
      ventasSalesService.listProcesses({
        page: 1,
        limit: 500,
        status: 'ACTIVE',
      }),
  })
}

export function useVentasAddProcessNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ processId, text }: { processId: string; text: string }) =>
      ventasSalesService.addNote(processId, text),
    onSuccess: (_, { processId }) => {
      invalidateVentasFollowUpQueries(qc, processId)
      void markapAlert.toast.success('Nota agregada')
    },
    onError: (e) => void markapAlert.toast.error('Error', getApiErrorMessage(e)),
  })
}

export function useVentasAddActivity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      processId,
      body,
    }: {
      processId: string
      body: Parameters<typeof ventasSalesService.addActivity>[1]
    }) => ventasSalesService.addActivity(processId, body),
    onSuccess: (_, { processId }) => {
      invalidateVentasFollowUpQueries(qc, processId)
      void markapAlert.toast.success('Actividad registrada')
    },
    onError: (e) => void markapAlert.toast.error('Error', getApiErrorMessage(e)),
  })
}

export function useVentasAddReminder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      processId,
      body,
    }: {
      processId: string
      body: { title: string; dueAt: string }
    }) => ventasSalesService.addReminder(processId, body),
    onSuccess: (_, { processId }) => {
      invalidateVentasFollowUpQueries(qc, processId)
      void markapAlert.toast.success('Recordatorio creado')
    },
    onError: (e) => void markapAlert.toast.error('Error', getApiErrorMessage(e)),
  })
}

export function useVentasCompleteReminder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ reminderId }: { reminderId: string; processId: string }) =>
      ventasSalesService.completeReminder(reminderId),
    onSuccess: (_, { processId }) => {
      invalidateVentasFollowUpQueries(qc, processId)
      void markapAlert.toast.success('Recordatorio completado')
    },
    onError: (e) => void markapAlert.toast.error('Error', getApiErrorMessage(e)),
  })
}

export function useVentasSeparationsList(
  params: Ref<{ page: number; limit: number; status?: string }>,
) {
  return useQuery({
    queryKey: computed(() => ventasSalesKeys.separations(params.value)),
    queryFn: () => ventasSalesService.listSeparations(params.value),
  })
}

export function useVentasCreateSeparation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ventasSalesService.createSeparation,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ventasSalesKeys.root })
      void markapAlert.toast.success('Separación registrada — propiedad en estado Separada')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo registrar', getApiErrorMessage(e)),
  })
}

export function useVentasClosingsList(params: Ref<{ page: number; limit: number }>) {
  return useQuery({
    queryKey: computed(() => ventasSalesKeys.closings(params.value)),
    queryFn: () => ventasSalesService.listClosings(params.value),
  })
}

export function useVentasCreateClosing() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ventasSalesService.createClosing,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ventasSalesKeys.root })
      void markapAlert.toast.success('Cierre registrado — propiedad vendida y comisión pendiente')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo registrar el cierre', getApiErrorMessage(e)),
  })
}
