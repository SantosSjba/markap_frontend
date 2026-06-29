import type {
  ContabilidadPurchaseCreditNoteDTO,
  ContabilidadPurchaseDebitNoteDTO,
  ContabilidadPurchaseInvoiceDTO,
  ContabilidadPurchasePaymentDTO,
  ContabilidadSupplierDTO,
  CreatePurchaseCreditNoteBody,
  CreatePurchaseDebitNoteBody,
  CreatePurchaseInvoiceBody,
  CreatePurchasePaymentBody,
  CreateSupplierBody,
  ListPurchaseInvoicesParams,
  ListSuppliersParams,
  UpdateSupplierBody,
} from '../purchases.types'

export interface ContabilidadPurchasesRepository {
  listSuppliers(params?: ListSuppliersParams): Promise<{ suppliers: ContabilidadSupplierDTO[] }>
  createSupplier(body: CreateSupplierBody): Promise<ContabilidadSupplierDTO>
  updateSupplier(id: string, body: UpdateSupplierBody): Promise<ContabilidadSupplierDTO>

  listInvoices(params?: ListPurchaseInvoicesParams): Promise<{
    invoices: ContabilidadPurchaseInvoiceDTO[]
    statusLabels: Record<string, string>
    taxAffectationLabels: Record<string, string>
    documentTypeLabels: Record<string, string>
  }>
  getInvoice(id: string): Promise<ContabilidadPurchaseInvoiceDTO>
  createInvoice(body: CreatePurchaseInvoiceBody): Promise<ContabilidadPurchaseInvoiceDTO>
  cancelInvoice(id: string): Promise<ContabilidadPurchaseInvoiceDTO>

  listCreditNotes(params?: { periodId?: string; supplierId?: string; search?: string }): Promise<{
    creditNotes: ContabilidadPurchaseCreditNoteDTO[]
  }>
  createCreditNote(body: CreatePurchaseCreditNoteBody): Promise<ContabilidadPurchaseCreditNoteDTO>

  listDebitNotes(params?: { periodId?: string; supplierId?: string; search?: string }): Promise<{
    debitNotes: ContabilidadPurchaseDebitNoteDTO[]
  }>
  createDebitNote(body: CreatePurchaseDebitNoteBody): Promise<ContabilidadPurchaseDebitNoteDTO>

  listPayments(params?: { periodId?: string; supplierId?: string; invoiceId?: string }): Promise<{
    payments: ContabilidadPurchasePaymentDTO[]
  }>
  createPayment(body: CreatePurchasePaymentBody): Promise<ContabilidadPurchasePaymentDTO>
}
