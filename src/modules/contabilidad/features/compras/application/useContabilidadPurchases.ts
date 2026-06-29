import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { markapAlert } from '@/shared/composables'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import { invalidateQuerySubtree } from '@/shared/utils/invalidateQuerySubtree'
import type {
  CreatePurchaseCreditNoteBody,
  CreatePurchaseDebitNoteBody,
  CreatePurchaseInvoiceBody,
  CreatePurchasePaymentBody,
  CreateSupplierBody,
  ListPurchaseInvoicesParams,
  ListSuppliersParams,
  UpdateSupplierBody,
} from '../domain/purchases.types'
import { contabilidadPurchasesApiRepository as purchasesRepository } from '../infrastructure/repositories/contabilidad-purchases.api.repository'

export const contabilidadPurchasesKeys = {
  root: ['contabilidad-purchases'] as const,
  suppliers: (params: ListSuppliersParams) => [...contabilidadPurchasesKeys.root, 'suppliers', params] as const,
  invoices: (params: ListPurchaseInvoicesParams) => [...contabilidadPurchasesKeys.root, 'invoices', params] as const,
  invoice: (id: string) => [...contabilidadPurchasesKeys.root, 'invoice', id] as const,
  creditNotes: (params: Record<string, string | undefined>) =>
    [...contabilidadPurchasesKeys.root, 'credit-notes', params] as const,
  debitNotes: (params: Record<string, string | undefined>) =>
    [...contabilidadPurchasesKeys.root, 'debit-notes', params] as const,
  payments: (params: Record<string, string | undefined>) =>
    [...contabilidadPurchasesKeys.root, 'payments', params] as const,
}

export function invalidateContabilidadPurchasesCache(qc: QueryClient) {
  return invalidateQuerySubtree(qc, contabilidadPurchasesKeys.root)
}

export function useContabilidadSuppliers(params: Ref<ListSuppliersParams>) {
  return useQuery({
    queryKey: computed(() => contabilidadPurchasesKeys.suppliers(params.value)),
    queryFn: () => purchasesRepository.listSuppliers(params.value),
    staleTime: 10_000,
  })
}

export function useContabilidadCreateSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateSupplierBody) => purchasesRepository.createSupplier(body),
    onSuccess: () => {
      void invalidateContabilidadPurchasesCache(qc)
      void markapAlert.toast.success('Proveedor registrado')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo registrar', getApiErrorMessage(e)),
  })
}

export function useContabilidadUpdateSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateSupplierBody }) =>
      purchasesRepository.updateSupplier(id, body),
    onSuccess: () => {
      void invalidateContabilidadPurchasesCache(qc)
      void markapAlert.toast.success('Proveedor actualizado')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo actualizar', getApiErrorMessage(e)),
  })
}

export function useContabilidadPurchaseInvoices(params: Ref<ListPurchaseInvoicesParams>) {
  return useQuery({
    queryKey: computed(() => contabilidadPurchasesKeys.invoices(params.value)),
    queryFn: () => purchasesRepository.listInvoices(params.value),
    staleTime: 10_000,
  })
}

export function useContabilidadCreatePurchaseInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreatePurchaseInvoiceBody) => purchasesRepository.createInvoice(body),
    onSuccess: () => {
      void invalidateContabilidadPurchasesCache(qc)
      void markapAlert.toast.success('Factura registrada con asiento automático')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo registrar', getApiErrorMessage(e)),
  })
}

export function useContabilidadCancelPurchaseInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => purchasesRepository.cancelInvoice(id),
    onSuccess: () => {
      void invalidateContabilidadPurchasesCache(qc)
      void markapAlert.toast.success('Factura anulada')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo anular', getApiErrorMessage(e)),
  })
}

export function useContabilidadPurchaseCreditNotes(params: Ref<Record<string, string | undefined>>) {
  return useQuery({
    queryKey: computed(() => contabilidadPurchasesKeys.creditNotes(params.value)),
    queryFn: () => purchasesRepository.listCreditNotes(params.value),
    staleTime: 10_000,
  })
}

export function useContabilidadCreatePurchaseCreditNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreatePurchaseCreditNoteBody) => purchasesRepository.createCreditNote(body),
    onSuccess: () => {
      void invalidateContabilidadPurchasesCache(qc)
      void markapAlert.toast.success('Nota de crédito registrada')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo registrar', getApiErrorMessage(e)),
  })
}

export function useContabilidadPurchaseDebitNotes(params: Ref<Record<string, string | undefined>>) {
  return useQuery({
    queryKey: computed(() => contabilidadPurchasesKeys.debitNotes(params.value)),
    queryFn: () => purchasesRepository.listDebitNotes(params.value),
    staleTime: 10_000,
  })
}

export function useContabilidadCreatePurchaseDebitNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreatePurchaseDebitNoteBody) => purchasesRepository.createDebitNote(body),
    onSuccess: () => {
      void invalidateContabilidadPurchasesCache(qc)
      void markapAlert.toast.success('Nota de débito registrada')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo registrar', getApiErrorMessage(e)),
  })
}

export function useContabilidadPurchasePayments(params: Ref<Record<string, string | undefined>>) {
  return useQuery({
    queryKey: computed(() => contabilidadPurchasesKeys.payments(params.value)),
    queryFn: () => purchasesRepository.listPayments(params.value),
    staleTime: 10_000,
  })
}

export function useContabilidadCreatePurchasePayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreatePurchasePaymentBody) => purchasesRepository.createPayment(body),
    onSuccess: () => {
      void invalidateContabilidadPurchasesCache(qc)
      void markapAlert.toast.success('Pago registrado')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo registrar', getApiErrorMessage(e)),
  })
}
