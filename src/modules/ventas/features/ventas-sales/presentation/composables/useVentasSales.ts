import { ventasSalesRepositoryKey } from '../../application/ports/ventas-sales.port'
import { useService } from '@shared/presentation/di/services'
import type { VentasSalesRepository } from '../../domain/repositories/ventas-sales.repository'
import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/vue-query'
import { computed, unref, type Ref } from 'vue'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { invalidateQuerySubtree } from '@shared/utils/invalidateQuerySubtree'
import { fetchAllPages } from '@shared/utils/fetchAllPages'
import { ventasPropertyKeys } from '../../../propiedades/presentation/composables/useVentasProperties'
import { ventasFinanzasKeys } from '../../../ventas-finanzas/presentation/composables/useVentasFinanzas'
import { invalidateVentasReportesCache } from '../../../ventas-reportes/presentation/composables/useVentasReportes'
import { invalidateVentasRelatedData } from '../../../../presentation/composables/invalidateVentasRelatedData'
export const ventasSalesKeys = {
  root: ['ventas-sales'] as const,
  processes: (params: object) => [...ventasSalesKeys.root, 'processes', params] as const,
  processDetail: (id: string) => [...ventasSalesKeys.root, 'process', id] as const,
  processStats: () => [...ventasSalesKeys.root, 'process-stats'] as const,
  separations: (params: object) => [...ventasSalesKeys.root, 'separations', params] as const,
  separationStats: () => [...ventasSalesKeys.root, 'separation-stats'] as const,
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

type UpdateProcessBody = Parameters<VentasSalesRepository['updateProcess']>[1]

function afterProcessMutation(qc: QueryClient, body?: UpdateProcessBody) {
  invalidateVentasSalesCache(qc)
  touchVentasReportes(qc)
  if (body?.status === 'LOST') {
    // La caída anula comisiones, vence la separación y libera el inmueble
    void invalidateVentasRelatedData(qc)
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
  const ventasSalesRepository = useService(ventasSalesRepositoryKey)
  return useQuery({
    queryKey: computed(() => ventasSalesKeys.processes(params.value)),
    queryFn: () => ventasSalesRepository.listProcesses(params.value),
  })
}

/** Resumen de procesos para las tarjetas del listado */
export function useVentasProcessStats() {
  const ventasSalesRepository = useService(ventasSalesRepositoryKey)
  return useQuery({
    queryKey: ventasSalesKeys.processStats(),
    queryFn: () => ventasSalesRepository.getProcessStats(),
  })
}

export function useVentasProcessDetail(id: Ref<string> | string) {
  const ventasSalesRepository = useService(ventasSalesRepositoryKey)
  return useQuery({
    queryKey: computed(() => ventasSalesKeys.processDetail(unref(id))),
    queryFn: () => ventasSalesRepository.getProcess(unref(id)),
    enabled: computed(() => !!unref(id)),
  })
}

export function useVentasFinancingChannels() {
  const ventasSalesRepository = useService(ventasSalesRepositoryKey)
  return useQuery({
    queryKey: [...ventasSalesKeys.root, 'financing-channels'] as const,
    queryFn: () => ventasSalesRepository.listFinancingChannels(),
    staleTime: 5 * 60 * 1000,
  })
}

export function useVentasCreateProcess() {
  const ventasSalesRepository = useService(ventasSalesRepositoryKey)
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
  const ventasSalesRepository = useService(ventasSalesRepositoryKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string
      body: Parameters<VentasSalesRepository['updateProcess']>[1]
    }) => ventasSalesRepository.updateProcess(id, body),
    onSuccess: (_data, { body }) => {
      afterProcessMutation(qc, body)
      void markapAlert.toast.success('Proceso actualizado')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo guardar', getApiErrorMessage(e)),
  })
}

/** Actualizar etapa/estado sin toast de éxito (arrastre en pipeline Kanban). */
export function useVentasUpdateProcessQuiet() {
  const ventasSalesRepository = useService(ventasSalesRepositoryKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string
      body: Parameters<VentasSalesRepository['updateProcess']>[1]
    }) => ventasSalesRepository.updateProcess(id, body),
    onSuccess: (_data, { body }) => {
      afterProcessMutation(qc, body)
    },
    onError: (e) =>
      void markapAlert.toast.error('No se pudo mover la tarjeta', getApiErrorMessage(e)),
  })
}

export function useVentasPipelineBoard() {
  const ventasSalesRepository = useService(ventasSalesRepositoryKey)
  return useQuery({
    queryKey: [...ventasSalesKeys.root, 'pipeline-board', 'active'] as const,
    // Todas las páginas: el backend topa cada página en 100 filas
    queryFn: async () => {
      const data = await fetchAllPages(
        (page, limit) => ventasSalesRepository.listProcesses({ page, limit, status: 'ACTIVE' }),
        100,
      )
      return { data, total: data.length }
    },
  })
}

export function useVentasAddProcessNote() {
  const ventasSalesRepository = useService(ventasSalesRepositoryKey)
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
  const ventasSalesRepository = useService(ventasSalesRepositoryKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      processId,
      body,
    }: {
      processId: string
      body: Parameters<VentasSalesRepository['addActivity']>[1]
    }) => ventasSalesRepository.addActivity(processId, body),
    onSuccess: () => {
      invalidateVentasSalesCache(qc)
      void markapAlert.toast.success('Actividad registrada')
    },
    onError: (e) => void markapAlert.toast.error('Error', getApiErrorMessage(e)),
  })
}

export function useVentasAddReminder() {
  const ventasSalesRepository = useService(ventasSalesRepositoryKey)
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
  const ventasSalesRepository = useService(ventasSalesRepositoryKey)
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
  params: Ref<{ page: number; limit: number; status?: string; search?: string }>,
) {
  const ventasSalesRepository = useService(ventasSalesRepositoryKey)
  return useQuery({
    queryKey: computed(() => ventasSalesKeys.separations(params.value)),
    queryFn: () => ventasSalesRepository.listSeparations(params.value),
  })
}

/** Resumen de separaciones para las tarjetas del listado */
export function useVentasSeparationStats() {
  const ventasSalesRepository = useService(ventasSalesRepositoryKey)
  return useQuery({
    queryKey: ventasSalesKeys.separationStats(),
    queryFn: () => ventasSalesRepository.getSeparationStats(),
  })
}

/** Vencer, reactivar o cambiar la fecha límite de una separación (libera o reserva el inmueble) */
export function useVentasPatchSeparation() {
  const ventasSalesRepository = useService(ventasSalesRepositoryKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<VentasSalesRepository['patchSeparation']>[1] }) =>
      ventasSalesRepository.patchSeparation(id, body),
    onSuccess: (_d, vars) => {
      invalidateVentasSalesCache(qc)
      touchVentasProperties(qc)
      const msg =
        vars.body.status === 'EXPIRED'
          ? 'Separación vencida — el inmueble vuelve a estar disponible'
          : vars.body.status === 'ACTIVE'
            ? 'Separación reactivada — el inmueble vuelve a estar separado'
            : 'Separación actualizada'
      void markapAlert.toast.success(msg)
    },
    onError: (e) => void markapAlert.toast.error('No se pudo actualizar', getApiErrorMessage(e)),
  })
}

export function useVentasCreateSeparation() {
  const ventasSalesRepository = useService(ventasSalesRepositoryKey)
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

export function useVentasUploadSeparationReceipt() {
  const ventasSalesRepository = useService(ventasSalesRepositoryKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      ventasSalesRepository.uploadSeparationReceipt(id, file),
    onSuccess: () => {
      invalidateVentasSalesCache(qc)
      void markapAlert.toast.success('Comprobante subido')
    },
    onError: (e) =>
      void markapAlert.toast.error('No se pudo subir el comprobante', getApiErrorMessage(e)),
  })
}

export function useVentasClosingsList(params: Ref<{ page: number; limit: number }>) {
  const ventasSalesRepository = useService(ventasSalesRepositoryKey)
  return useQuery({
    queryKey: computed(() => ventasSalesKeys.closings(params.value)),
    queryFn: () => ventasSalesRepository.listClosings(params.value),
  })
}

export function useVentasCreateClosing() {
  const ventasSalesRepository = useService(ventasSalesRepositoryKey)
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
    onError: (e) =>
      void markapAlert.toast.error('No se pudo registrar el cierre', getApiErrorMessage(e)),
  })
}

export function useVentasUploadClosingContract() {
  const ventasSalesRepository = useService(ventasSalesRepositoryKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      ventasSalesRepository.uploadClosingContract(id, file),
    onSuccess: () => {
      invalidateVentasSalesCache(qc)
      void markapAlert.toast.success('Contrato adjunto')
    },
    onError: (e) =>
      void markapAlert.toast.error('No se pudo subir el contrato', getApiErrorMessage(e)),
  })
}

export function useVentasClosingReadiness(
  params: Ref<{ propertyId: string; buyerClientId: string }>,
) {
  const ventasSalesRepository = useService(ventasSalesRepositoryKey)
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
  const ventasSalesRepository = useService(ventasSalesRepositoryKey)
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
  const ventasSalesRepository = useService(ventasSalesRepositoryKey)
  return useQuery({
    queryKey: computed(() =>
      ventasSalesKeys.complianceDocuments(params.value.propertyId, params.value.buyerClientId),
    ),
    queryFn: () => ventasSalesRepository.listComplianceDocuments(params.value),
    enabled: computed(() => !!params.value.propertyId && !!params.value.buyerClientId),
  })
}

export function useVentasUpsertComplianceChecklist() {
  const ventasSalesRepository = useService(ventasSalesRepositoryKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ventasSalesRepository.upsertComplianceChecklist,
    onSuccess: () => {
      invalidateVentasSalesCache(qc)
      void markapAlert.toast.success('Checklist legal actualizado')
    },
    onError: (e) =>
      void markapAlert.toast.error('No se pudo guardar checklist', getApiErrorMessage(e)),
  })
}

export function useVentasUploadComplianceDocument() {
  const ventasSalesRepository = useService(ventasSalesRepositoryKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ventasSalesRepository.uploadComplianceDocument,
    onSuccess: () => {
      invalidateVentasSalesCache(qc)
      void markapAlert.toast.success('Documento de cumplimiento registrado')
    },
    onError: (e) =>
      void markapAlert.toast.error('No se pudo subir documento', getApiErrorMessage(e)),
  })
}

export function useVentasUploadPaymentEvidence() {
  const ventasSalesRepository = useService(ventasSalesRepositoryKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ventasSalesRepository.uploadPaymentEvidence,
    onSuccess: () => {
      invalidateVentasSalesCache(qc)
      void markapAlert.toast.success('Evidencia de pago registrada')
    },
    onError: (e) =>
      void markapAlert.toast.error('No se pudo subir evidencia de pago', getApiErrorMessage(e)),
  })
}

export function useVentasTaxPreview(
  params: Ref<{
    salePrice: number
    acquisitionCost?: number
    alcabalaApplicable?: boolean
    rent2Applicable?: boolean
    uit?: number
    /** Soles por unidad de la moneda de la venta */
    exchangeRate?: number
  }>,
) {
  const ventasSalesRepository = useService(ventasSalesRepositoryKey)
  return useQuery({
    queryKey: computed(() => ventasSalesKeys.taxPreview(params.value)),
    queryFn: () => ventasSalesRepository.getTaxPreview(params.value),
    enabled: computed(() => Number(params.value.salePrice) > 0),
  })
}

export function useVentasCompliancePendingBoard(
  params: Ref<{ limit?: number; offset?: number; sunarpStatus?: string; onlyOverdue?: boolean }>,
) {
  const ventasSalesRepository = useService(ventasSalesRepositoryKey)
  return useQuery({
    queryKey: computed(() => ventasSalesKeys.compliancePendingBoard(params.value)),
    queryFn: () => ventasSalesRepository.getCompliancePendingBoard(params.value),
  })
}

export function useVentasDispatchComplianceAlerts() {
  const ventasSalesRepository = useService(ventasSalesRepositoryKey)
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
