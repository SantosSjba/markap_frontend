export const CONTABILIDAD_SALES_APP_SLUG = 'contabilidad'

export const SALES_STATUS = {
  PENDING: 'PENDING',
  PARTIAL: 'PARTIAL',
  PAID: 'PAID',
  CANCELLED: 'CANCELLED',
} as const

export const SALES_DOCUMENT_TYPE = {
  FACTURA: 'FACTURA',
  BOLETA: 'BOLETA',
} as const

export const SALES_TAX_AFFECTATION = {
  TAXABLE: 'TAXABLE',
  EXEMPT: 'EXEMPT',
  NON_TAXABLE: 'NON_TAXABLE',
} as const

export const SALES_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  PARTIAL: 'Parcial',
  PAID: 'Cobrada',
  CANCELLED: 'Anulada',
}

export const SALES_TAX_AFFECTATION_LABELS: Record<string, string> = {
  TAXABLE: 'Gravada',
  EXEMPT: 'Exonerada',
  NON_TAXABLE: 'Inafecta',
}

export const SALES_TAX_AFFECTATION_OPTIONS = Object.entries(SALES_TAX_AFFECTATION_LABELS).map(
  ([value, label]) => ({ value, label }),
)

export const SALES_STATUS_FILTER_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  ...Object.entries(SALES_STATUS_LABELS).map(([value, label]) => ({ value, label })),
]

export interface ContabilidadCustomerDTO {
  id: string
  ruc: string
  businessName: string
  tradeName: string | null
  address: string | null
  email: string | null
  phone: string | null
  isActive: boolean
  receivableBalance: string
  invoiceCount: number
  createdAt: string
}

export interface ContabilidadSalesInvoiceDTO {
  id: string
  customerId: string
  customerRuc: string
  customerName: string
  periodId: string
  documentType: string
  series: string
  number: string
  fullNumber: string
  issueDate: string
  dueDate: string | null
  taxAffectation: string
  currencyCode: string
  exchangeRate: string | null
  foreignTaxableBase: string | null
  incomeAccountId: string
  incomeAccountCode: string
  incomeAccountName: string
  taxableBase: string
  igvAmount: string
  totalAmount: string
  collectedAmount: string
  balanceAmount: string
  status: string
  notes: string | null
  journalEntryId: string | null
  cancelledAt: string | null
  createdAt: string
}

export interface ContabilidadSalesCreditNoteDTO {
  id: string
  customerId: string
  customerRuc: string
  customerName: string
  invoiceId: string | null
  invoiceFullNumber: string | null
  periodId: string
  series: string
  number: string
  fullNumber: string
  issueDate: string
  taxableBase: string
  igvAmount: string
  totalAmount: string
  reason: string | null
  status: string
  journalEntryId: string | null
  createdAt: string
}

export interface ContabilidadSalesCollectionDTO {
  id: string
  invoiceId: string
  invoiceFullNumber: string
  customerRuc: string
  customerName: string
  periodId: string
  amount: string
  collectionDate: string
  description: string
  sourceType: string
  cashBoxId: string | null
  cashBoxCode: string | null
  bankAccountId: string | null
  bankCode: string | null
  treasuryMovementId: string | null
  journalEntryId: string | null
  createdAt: string
}

export interface CreateCustomerBody {
  ruc: string
  businessName: string
  tradeName?: string | null
  address?: string | null
  email?: string | null
  phone?: string | null
}

export interface UpdateCustomerBody {
  businessName?: string
  tradeName?: string | null
  address?: string | null
  email?: string | null
  phone?: string | null
  isActive?: boolean
}

export interface CreateSalesInvoiceBody {
  customerId: string
  periodId: string
  documentType: string
  series: string
  number: string
  issueDate: string
  dueDate?: string | null
  taxAffectation: string
  currencyCode?: string
  exchangeRate?: number | string | null
  foreignTaxableBase?: number | string | null
  incomeAccountId: string
  taxableBase: number | string
  igvAmount?: number | string
  notes?: string | null
}

export interface ContabilidadSalesDebitNoteDTO {
  id: string
  customerId: string
  customerRuc: string
  customerName: string
  invoiceId: string | null
  invoiceFullNumber: string | null
  periodId: string
  series: string
  number: string
  fullNumber: string
  issueDate: string
  taxableBase: string
  igvAmount: string
  totalAmount: string
  reason: string | null
  status: string
  journalEntryId: string | null
  createdAt: string
}

export interface CreateSalesCreditNoteBody {
  customerId: string
  invoiceId?: string | null
  periodId: string
  series: string
  number: string
  issueDate: string
  taxableBase: number | string
  igvAmount?: number | string
  reason?: string | null
}

export interface CreateSalesDebitNoteBody {
  customerId: string
  invoiceId?: string | null
  periodId: string
  series: string
  number: string
  issueDate: string
  taxableBase: number | string
  igvAmount?: number | string
  reason?: string | null
}

export interface CreateSalesCollectionBody {
  invoiceId: string
  periodId: string
  amount: number | string
  collectionDate: string
  description: string
  sourceType: 'CASH' | 'BANK'
  cashBoxId?: string | null
  bankAccountId?: string | null
}

export interface ListSalesInvoicesParams {
  periodId?: string
  customerId?: string
  documentType?: string
  status?: string
  search?: string
}

export function salesStatusVariant(status: string): 'success' | 'warning' | 'neutral' | 'error' {
  if (status === SALES_STATUS.PAID) return 'success'
  if (status === SALES_STATUS.PARTIAL) return 'warning'
  if (status === SALES_STATUS.CANCELLED) return 'error'
  return 'neutral'
}
