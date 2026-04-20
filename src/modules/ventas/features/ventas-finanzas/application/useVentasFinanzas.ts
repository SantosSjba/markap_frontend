import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/vue-query'
import { computed, unref, type Ref } from 'vue'
import { markapAlert } from '@/shared/alert'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import { invalidateQuerySubtree } from '@/shared/utils/invalidateQuerySubtree'
import { invalidateVentasReportesCache } from '@ventas/reportes'
import { ventasFinanzasService } from '../infrastructure/ventasFinanzas.service'

export const ventasFinanzasKeys = {
  root: ['ventas-finanzas'] as const,
  buyerPayments: (params: object) => [...ventasFinanzasKeys.root, 'buyer-payments', params] as const,
  commissions: (params: object) => [...ventasFinanzasKeys.root, 'commissions', params] as const,
  docCosts: (params: object) => [...ventasFinanzasKeys.root, 'doc-costs', params] as const,
  profiles: () => [...ventasFinanzasKeys.root, 'profiles'] as const,
  profitability: (closingId: string) =>
    [...ventasFinanzasKeys.root, 'profitability', closingId] as const,
}

export function invalidateVentasFinanzasCache(qc: QueryClient) {
  return invalidateQuerySubtree(qc, ventasFinanzasKeys.root)
}

/** Cierres y finanzas comparten comisiones y costos; mantener listas alineadas. */
function invalidateVentasSalesAndFinanzas(qc: QueryClient) {
  return Promise.all([
    invalidateQuerySubtree(qc, ['ventas-sales']),
    invalidateVentasFinanzasCache(qc),
    invalidateVentasReportesCache(qc),
  ]).then(() => undefined)
}

export function useVentasBuyerPaymentsList(
  params: Ref<{
    page: number
    limit: number
    buyerClientId?: string
    kind?: string
    displayStatus?: string
  }>,
) {
  return useQuery({
    queryKey: computed(() => ventasFinanzasKeys.buyerPayments(params.value)),
    queryFn: () => ventasFinanzasService.listBuyerPayments(params.value),
  })
}

export function useVentasCreateBuyerPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ventasFinanzasService.createBuyerPayment,
    onSuccess: () => {
      void invalidateVentasSalesAndFinanzas(qc)
      void markapAlert.toast.success('Pago registrado')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo registrar', getApiErrorMessage(e)),
  })
}

export function useVentasMarkBuyerPaymentPaid() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, paidAt }: { id: string; paidAt?: string | null }) =>
      ventasFinanzasService.markBuyerPaymentPaid(id, paidAt !== undefined ? { paidAt } : {}),
    onSuccess: () => {
      void invalidateVentasSalesAndFinanzas(qc)
      void markapAlert.toast.success('Pago marcado como pagado')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo actualizar', getApiErrorMessage(e)),
  })
}

export function useVentasCommissionsList(
  params: Ref<{ page: number; limit: number; status?: string; agentId?: string }>,
) {
  return useQuery({
    queryKey: computed(() => ventasFinanzasKeys.commissions(params.value)),
    queryFn: () => ventasFinanzasService.listCommissions(params.value),
  })
}

export function useVentasCommissionProfiles() {
  return useQuery({
    queryKey: ventasFinanzasKeys.profiles(),
    queryFn: () => ventasFinanzasService.listCommissionProfiles(),
  })
}

export function useVentasMarkCommissionPaid() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => ventasFinanzasService.markCommissionPaid(id),
    onSuccess: () => {
      void invalidateVentasSalesAndFinanzas(qc)
      void markapAlert.toast.success('Comisión marcada como pagada')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo actualizar', getApiErrorMessage(e)),
  })
}

export function useVentasRecalculateCommission() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => ventasFinanzasService.recalculateCommission(id),
    onSuccess: () => {
      void invalidateVentasSalesAndFinanzas(qc)
      void markapAlert.toast.success('Comisión recalculada según perfil del asesor')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo recalcular', getApiErrorMessage(e)),
  })
}

export function useVentasUpsertCommissionProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ventasFinanzasService.upsertCommissionProfile,
    onSuccess: () => {
      void invalidateVentasFinanzasCache(qc)
      void markapAlert.toast.success('Porcentaje guardado')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo guardar', getApiErrorMessage(e)),
  })
}

export function useVentasDocumentationCostsList(
  params: Ref<{
    page: number
    limit: number
    saleClosingId?: string
    buyerClientId?: string
  }>,
) {
  return useQuery({
    queryKey: computed(() => ventasFinanzasKeys.docCosts(params.value)),
    queryFn: () => ventasFinanzasService.listDocumentationCosts(params.value),
  })
}

export function useVentasCreateDocumentationCost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ventasFinanzasService.createDocumentationCost,
    onSuccess: () => {
      void invalidateVentasSalesAndFinanzas(qc)
      void markapAlert.toast.success('Costo registrado')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo registrar', getApiErrorMessage(e)),
  })
}

export function useVentasClosingProfitability(closingId: Ref<string> | string) {
  return useQuery({
    queryKey: computed(() => ventasFinanzasKeys.profitability(unref(closingId))),
    queryFn: () => ventasFinanzasService.getProfitability(unref(closingId)),
    enabled: computed(() => !!unref(closingId)),
  })
}
