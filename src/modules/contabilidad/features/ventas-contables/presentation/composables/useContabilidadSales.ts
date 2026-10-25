import { contabilidadSalesRepositoryKey as salesRepositoryKey } from '../../application/ports/contabilidad-sales.port'
import { useService } from '@shared/presentation/di/services'
import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { invalidateModuleQueries } from '@shared/utils/invalidateModuleQueries'
import type {
  CreateCustomerBody,
  CreateSalesCollectionBody,
  CreateSalesCreditNoteBody,
  CreateSalesDebitNoteBody,
  CreateSalesInvoiceBody,
  ListSalesInvoicesParams,
  UpdateCustomerBody,
} from '../../domain/sales.types'
export const contabilidadSalesKeys = {
  root: ['contabilidad-sales'] as const,
  customers: (params: Record<string, unknown>) =>
    [...contabilidadSalesKeys.root, 'customers', params] as const,
  invoices: (params: ListSalesInvoicesParams) =>
    [...contabilidadSalesKeys.root, 'invoices', params] as const,
  creditNotes: (params: Record<string, string | undefined>) =>
    [...contabilidadSalesKeys.root, 'credit-notes', params] as const,
  debitNotes: (params: Record<string, string | undefined>) =>
    [...contabilidadSalesKeys.root, 'debit-notes', params] as const,
  collections: (params: Record<string, string | undefined>) =>
    [...contabilidadSalesKeys.root, 'collections', params] as const,
}

export function invalidateContabilidadSalesCache(qc: QueryClient) {
  return invalidateModuleQueries(qc, 'contabilidad')
}

export function useContabilidadCustomers(params: Ref<{ search?: string; activeOnly?: boolean }>) {
  const salesRepository = useService(salesRepositoryKey)
  return useQuery({
    queryKey: computed(() => contabilidadSalesKeys.customers(params.value)),
    queryFn: () => salesRepository.listCustomers(params.value),
    staleTime: 10_000,
  })
}

export function useContabilidadCreateCustomer() {
  const salesRepository = useService(salesRepositoryKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateCustomerBody) => salesRepository.createCustomer(body),
    onSuccess: async () => {
      await invalidateContabilidadSalesCache(qc)
      void markapAlert.toast.success('Cliente registrado')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo registrar', getApiErrorMessage(e)),
  })
}

export function useContabilidadUpdateCustomer() {
  const salesRepository = useService(salesRepositoryKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateCustomerBody }) =>
      salesRepository.updateCustomer(id, body),
    onSuccess: async () => {
      await invalidateContabilidadSalesCache(qc)
      void markapAlert.toast.success('Cliente actualizado')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo actualizar', getApiErrorMessage(e)),
  })
}

export function useContabilidadSalesInvoices(params: Ref<ListSalesInvoicesParams>) {
  const salesRepository = useService(salesRepositoryKey)
  return useQuery({
    queryKey: computed(() => contabilidadSalesKeys.invoices(params.value)),
    queryFn: () => salesRepository.listInvoices(params.value),
    staleTime: 10_000,
  })
}

export function useContabilidadCreateSalesInvoice() {
  const salesRepository = useService(salesRepositoryKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateSalesInvoiceBody) => salesRepository.createInvoice(body),
    onSuccess: async () => {
      await invalidateContabilidadSalesCache(qc)
      void markapAlert.toast.success('Venta registrada con asiento automático')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo registrar', getApiErrorMessage(e)),
  })
}

export function useContabilidadCancelSalesInvoice() {
  const salesRepository = useService(salesRepositoryKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => salesRepository.cancelInvoice(id),
    onSuccess: async () => {
      await invalidateContabilidadSalesCache(qc)
      void markapAlert.toast.success('Comprobante anulado')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo anular', getApiErrorMessage(e)),
  })
}

export function useContabilidadSalesCreditNotes(params: Ref<Record<string, string | undefined>>) {
  const salesRepository = useService(salesRepositoryKey)
  return useQuery({
    queryKey: computed(() => contabilidadSalesKeys.creditNotes(params.value)),
    queryFn: () => salesRepository.listCreditNotes(params.value),
    staleTime: 10_000,
  })
}

export function useContabilidadCreateSalesCreditNote() {
  const salesRepository = useService(salesRepositoryKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateSalesCreditNoteBody) => salesRepository.createCreditNote(body),
    onSuccess: async () => {
      await invalidateContabilidadSalesCache(qc)
      void markapAlert.toast.success('Nota de crédito registrada')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo registrar', getApiErrorMessage(e)),
  })
}

export function useContabilidadSalesDebitNotes(params: Ref<Record<string, string | undefined>>) {
  const salesRepository = useService(salesRepositoryKey)
  return useQuery({
    queryKey: computed(() => contabilidadSalesKeys.debitNotes(params.value)),
    queryFn: () => salesRepository.listDebitNotes(params.value),
    staleTime: 10_000,
  })
}

export function useContabilidadCreateSalesDebitNote() {
  const salesRepository = useService(salesRepositoryKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateSalesDebitNoteBody) => salesRepository.createDebitNote(body),
    onSuccess: async () => {
      await invalidateContabilidadSalesCache(qc)
      void markapAlert.toast.success('Nota de débito registrada')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo registrar', getApiErrorMessage(e)),
  })
}

export function useContabilidadSalesCollections(params: Ref<Record<string, string | undefined>>) {
  const salesRepository = useService(salesRepositoryKey)
  return useQuery({
    queryKey: computed(() => contabilidadSalesKeys.collections(params.value)),
    queryFn: () => salesRepository.listCollections(params.value),
    staleTime: 10_000,
  })
}

export function useContabilidadCreateSalesCollection() {
  const salesRepository = useService(salesRepositoryKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateSalesCollectionBody) => salesRepository.createCollection(body),
    onSuccess: async () => {
      await invalidateContabilidadSalesCache(qc)
      void markapAlert.toast.success('Cobro registrado')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo registrar', getApiErrorMessage(e)),
  })
}
