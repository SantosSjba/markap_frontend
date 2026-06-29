import type {
  ContabilidadCustomerDTO,
  ContabilidadSalesCollectionDTO,
  ContabilidadSalesCreditNoteDTO,
  ContabilidadSalesInvoiceDTO,
  CreateCustomerBody,
  CreateSalesCollectionBody,
  CreateSalesCreditNoteBody,
  CreateSalesInvoiceBody,
  ListSalesInvoicesParams,
  UpdateCustomerBody,
} from '../sales.types'

export interface ContabilidadSalesRepository {
  listCustomers(params?: { search?: string; activeOnly?: boolean }): Promise<{ customers: ContabilidadCustomerDTO[] }>
  createCustomer(body: CreateCustomerBody): Promise<ContabilidadCustomerDTO>
  updateCustomer(id: string, body: UpdateCustomerBody): Promise<ContabilidadCustomerDTO>

  listInvoices(params?: ListSalesInvoicesParams): Promise<{
    invoices: ContabilidadSalesInvoiceDTO[]
    statusLabels: Record<string, string>
    taxAffectationLabels: Record<string, string>
    documentTypeLabels: Record<string, string>
  }>
  createInvoice(body: CreateSalesInvoiceBody): Promise<ContabilidadSalesInvoiceDTO>
  cancelInvoice(id: string): Promise<ContabilidadSalesInvoiceDTO>

  listCreditNotes(params?: { periodId?: string; customerId?: string; search?: string }): Promise<{
    creditNotes: ContabilidadSalesCreditNoteDTO[]
  }>
  createCreditNote(body: CreateSalesCreditNoteBody): Promise<ContabilidadSalesCreditNoteDTO>

  listCollections(params?: { periodId?: string; customerId?: string; invoiceId?: string }): Promise<{
    collections: ContabilidadSalesCollectionDTO[]
  }>
  createCollection(body: CreateSalesCollectionBody): Promise<ContabilidadSalesCollectionDTO>
}
