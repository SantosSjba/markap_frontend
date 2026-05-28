import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/vue-query'
import { computed, unref, type Ref } from 'vue'
import { markapAlert } from '@/shared/composables'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import { invalidateQuerySubtree } from '@/shared/utils/invalidateQuerySubtree'
import { ventasPropertyKeys } from '@modules/ventas/features/propiedades'
import { ventasFinanzasKeys } from '@ventas/finanzas'
import { invalidateVentasReportesCache } from '@ventas/reportes'
import { ventasSalesApiRepository as ventasSalesRepository } from '../infrastructure/repositories/ventas-sales.api.repository'

export const ventasSalesKeys = {
  root: ['ventas-sales'] as const,
  processes: (params: object) => [...ventasSalesKeys.root, 'processes', params] as const,
  processDetail: (id: string) => [...ventasSalesKeys.root, 'process', id] as const,
  separations: (params: object) => [...ventasSalesKeys.root, 'separations', params] as const,
  closings: (params: object) => [...ventasSalesKeys.root, 'closings', params] as const,
  closingReadiness: (propertyId: string, buyerClientId: string) =>
    [...ventasSalesKeys.root, 'closing-readiness', propertyId, buyerClientId] as const,
  complianceChecklist: (propertyId: string, buyerClientId: string) =>
    [...ventasSalesKeys.root, 'compliance-checklist', propertyId, buyerClientId] as const,
  complianceDocuments: (propertyId: string, buyerClientId: string) =>
    [...ventasSalesKeys.root, 'compliance-documents', propertyId, buyerClientId] as const,
  taxPreview: (params: object) => [...ventasSalesKeys.root, 'tax-preview', params] as const,
  compliancePendingBoard: (params: object) =>
    [...ventasSalesKeys.root, 'compliance-pending-board', params] as const,
}

/**
 * Invalida todo el módulo ventas-sales (listados, pipeline, detalle, separaciones, cierres).
 */
export function invalidateVentasSalesCache(qc: QueryClient) {
  invalidateQuerySubtree(qc, ventasSalesKeys.root)
}

function touchVentasReportes(qc: QueryClient) {
  void invalidateVentasReportesCache(qc)
}

function touchVentasFinanzas(qc: QueryClient) {
  void invalidateQuerySubtree(qc, ventasFinanzasKeys.root)
}

function touchVentasProperties(qc: QueryClient) {
  void invalidateQuerySubtree(qc, ventasPropertyKeys.root)
}

type UpdateProcessBody = Parameters<typeof ventasSalesRepository.updateProcess>[1]

function afterProcessMutation(
  qc: QueryClient,
  body?: UpdateProcessBody,
) {
  invalidateVentasSalesCache(qc)
  touchVentasReportes(qc)
  if (body?.status === 'LOST') {
    touchVentasFinanzas(qc)
  }
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
    queryFn: () => ventasSalesRepository.listProcesses(params.value),
  })
}

export function useVentasProcessDetail(id: Ref<string> | string) {
  return useQuery({
    queryKey: computed(() => ventasSalesKeys.processDetail(unref(id))),
    queryFn: () => ventasSalesRepository.getProcess(unref(id)),
    enabled: computed(() => !!unref(id)),
  })
}

export function useVentasFinancingChannels() {
  return useQuery({
    queryKey: [...ventasSalesKeys.root, 'financing-channels'] as const,
    queryFn: () => ventasSalesRepository.listFinancingChannels(),
    staleTime: 5 * 60 * 1000,
  })
}

export function useVentasCreateProcess() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ventasSalesRepository.createProcess,
    onSuccess: () => {
      invalidateVentasSalesCache(qc)
      touchVentasFinanzas(qc)
      touchVentasReportes(qc)
      void markapAlert.toast.success('Proceso creado')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo crear', getApiErrorMessage(e)),
  })
}

export function useVentasUpdateProcess() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof ventasSalesRepository.updateProcess>[1] }) =>
      ventasSalesRepository.updateProcess(id, body),
    onSuccess: (_data, { body }) => {
      afterProcessMutation(qc, body)
      void markapAlert.toast.success('Proceso actualizado')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo guardar', getApiErrorMessage(e)),
  })
}

/** Actualizar etapa/estado sin toast de éxito (arrastre en pipeline Kanban). */
export function useVentasUpdateProcessQuiet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof ventasSalesRepository.updateProcess>[1] }) =>
      ventasSalesRepository.updateProcess(id, body),
    onSuccess: (_data, { body }) => {
      afterProcessMutation(qc, body)
    },
    onError: (e) => void markapAlert.toast.error('No se pudo mover la tarjeta', getApiErrorMessage(e)),
  })
}

export function useVentasPipelineBoard() {
  return useQuery({
    queryKey: [...ventasSalesKeys.root, 'pipeline-board', 'active'] as const,
    queryFn: () =>
      ventasSalesRepository.listProcesses({
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
      ventasSalesRepository.addNote(processId, text),
    onSuccess: () => {
      invalidateVentasSalesCache(qc)
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
      body: Parameters<typeof ventasSalesRepository.addActivity>[1]
    }) => ventasSalesRepository.addActivity(processId, body),
    onSuccess: () => {
      invalidateVentasSalesCache(qc)
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
    }) => ventasSalesRepository.addReminder(processId, body),
    onSuccess: () => {
      invalidateVentasSalesCache(qc)
      void markapAlert.toast.success('Recordatorio creado')
    },
    onError: (e) => void markapAlert.toast.error('Error', getApiErrorMessage(e)),
  })
}

export function useVentasCompleteReminder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ reminderId }: { reminderId: string; processId: string }) =>
      ventasSalesRepository.completeReminder(reminderId),
    onSuccess: () => {
      invalidateVentasSalesCache(qc)
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
    queryFn: () => ventasSalesRepository.listSeparations(params.value),
  })
}

export function useVentasCreateSeparation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ventasSalesRepository.createSeparation,
    onSuccess: () => {
      invalidateVentasSalesCache(qc)
      touchVentasProperties(qc)
      touchVentasReportes(qc)
      void markapAlert.toast.success('Separación registrada — propiedad en estado Separada')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo registrar', getApiErrorMessage(e)),
  })
}

export function useVentasClosingsList(params: Ref<{ page: number; limit: number }>) {
  return useQuery({
    queryKey: computed(() => ventasSalesKeys.closings(params.value)),
    queryFn: () => ventasSalesRepository.listClosings(params.value),
  })
}

export function useVentasCreateClosing() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ventasSalesRepository.createClosing,
    onSuccess: () => {
      invalidateVentasSalesCache(qc)
      touchVentasFinanzas(qc)
      touchVentasProperties(qc)
      touchVentasReportes(qc)
      void markapAlert.toast.success('Cierre registrado — propiedad vendida y comisión pendiente')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo registrar el cierre', getApiErrorMessage(e)),
  })
}

export function useVentasClosingReadiness(
  params: Ref<{ propertyId: string; buyerClientId: string }>,
) {
  return useQuery({
    queryKey: computed(() =>
      ventasSalesKeys.closingReadiness(params.value.propertyId, params.value.buyerClientId),
    ),
    queryFn: () => ventasSalesRepository.getClosingReadiness(params.value),
    enabled: computed(() => !!params.value.propertyId && !!params.value.buyerClientId),
  })
}

export function useVentasComplianceChecklist(
  params: Ref<{ propertyId: string; buyerClientId: string }>,
) {
  return useQuery({
    queryKey: computed(() =>
      ventasSalesKeys.complianceChecklist(params.value.propertyId, params.value.buyerClientId),
    ),
    queryFn: () => ventasSalesRepository.getComplianceChecklist(params.value),
    enabled: computed(() => !!params.value.propertyId && !!params.value.buyerClientId),
  })
}

export function useVentasComplianceDocuments(
  params: Ref<{ propertyId: string; buyerClientId: string }>,
) {
  return useQuery({
    queryKey: computed(() =>
      ventasSalesKeys.complianceDocuments(params.value.propertyId, params.value.buyerClientId),
    ),
    queryFn: () => ventasSalesRepository.listComplianceDocuments(params.value),
    enabled: computed(() => !!params.value.propertyId && !!params.value.buyerClientId),
  })
}

export function useVentasUpsertComplianceChecklist() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ventasSalesRepository.upsertComplianceChecklist,
    onSuccess: () => {
      invalidateVentasSalesCache(qc)
      void markapAlert.toast.success('Checklist legal actualizado')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo guardar checklist', getApiErrorMessage(e)),
  })
}

export function useVentasUploadComplianceDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ventasSalesRepository.uploadComplianceDocument,
    onSuccess: () => {
      invalidateVentasSalesCache(qc)
      void markapAlert.toast.success('Documento de cumplimiento registrado')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo subir documento', getApiErrorMessage(e)),
  })
}

export function useVentasTaxPreview(
  params: Ref<{
    salePrice: number
    acquisitionCost?: number
    alcabalaApplicable?: boolean
    rent2Applicable?: boolean
    uit?: number
  }>,
) {
  return useQuery({
    queryKey: computed(() => ventasSalesKeys.taxPreview(params.value)),
    queryFn: () => ventasSalesRepository.getTaxPreview(params.value),
    enabled: computed(() => Number(params.value.salePrice) > 0),
  })
}

export function useVentasCompliancePendingBoard(
  params: Ref<{ limit?: number; offset?: number; sunarpStatus?: string; onlyOverdue?: boolean }>,
) {
  return useQuery({
    queryKey: computed(() => ventasSalesKeys.compliancePendingBoard(params.value)),
    queryFn: () => ventasSalesRepository.getCompliancePendingBoard(params.value),
  })
}

export function useVentasDispatchComplianceAlerts() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ventasSalesRepository.dispatchComplianceAlerts,
    onSuccess: () => {
      invalidateVentasSalesCache(qc)
      void markapAlert.toast.success('Alertas de cumplimiento procesadas')
    },
    onError: (e) =>
      void markapAlert.toast.error('No se pudieron procesar alertas', getApiErrorMessage(e)),
  })
}
