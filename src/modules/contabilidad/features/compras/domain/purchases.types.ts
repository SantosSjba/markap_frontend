export const CONTABILIDAD_PURCHASES_APP_SLUG = 'contabilidad'

export const PURCHASE_STATUS = {
  PENDING: 'PENDING',
  PARTIAL: 'PARTIAL',
  PAID: 'PAID',
  CANCELLED: 'CANCELLED',
} as const

export const PURCHASE_TAX_AFFECTATION = {
  TAXABLE: 'TAXABLE',
  EXEMPT: 'EXEMPT',
  NON_TAXABLE: 'NON_TAXABLE',
} as const

export const PURCHASE_DOCUMENT_TYPE = {
  FACTURA: 'FACTURA',
  BOLETA: 'BOLETA',
  RECIBO_HONORARIOS: 'RECIBO_HONORARIOS',
  OTRO: 'OTRO',
} as const

export const PURCHASE_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  PARTIAL: 'Parcial',
  PAID: 'Pagada',
  CANCELLED: 'Anulada',
}

export const PURCHASE_TAX_AFFECTATION_LABELS: Record<string, string> = {
  TAXABLE: 'Gravada',
  EXEMPT: 'Exonerada',
  NON_TAXABLE: 'Inafecta',
}

export const PURCHASE_DOCUMENT_TYPE_LABELS: Record<string, string> = {
  FACTURA: 'Factura',
  BOLETA: 'Boleta',
  RECIBO_HONORARIOS: 'Recibo por honorarios',
  OTRO: 'Otro',
}

export const PURCHASE_DOCUMENT_TYPE_OPTIONS = Object.entries(PURCHASE_DOCUMENT_TYPE_LABELS).map(
  ([value, label]) => ({ value, label }),
)

export const PURCHASE_TAX_AFFECTATION_OPTIONS = Object.entries(PURCHASE_TAX_AFFECTATION_LABELS).map(
  ([value, label]) => ({ value, label }),
)

export const PURCHASE_STATUS_FILTER_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  ...Object.entries(PURCHASE_STATUS_LABELS).map(([value, label]) => ({ value, label })),
]

export interface ContabilidadSupplierDTO {
  id: string
  ruc: string
  businessName: string
  countryCode: string
  isNonDomiciled: boolean
  tradeName: string | null
  address: string | null
  email: string | null
  phone: string | null
  isActive: boolean
  payableBalance: string
  invoiceCount: number
  createdAt: string
}

export const SUPPLIER_COUNTRY_OPTIONS = [
  { value: 'PE', label: 'PE — Perú' },
  { value: 'US', label: 'US — Estados Unidos' },
  { value: 'EC', label: 'EC — Ecuador' },
  { value: 'CO', label: 'CO — Colombia' },
  { value: 'CL', label: 'CL — Chile' },
  { value: 'BO', label: 'BO — Bolivia' },
  { value: 'AR', label: 'AR — Argentina' },
  { value: 'MX', label: 'MX — México' },
  { value: 'ES', label: 'ES — España' },
  { value: 'OT', label: 'OT — Otro' },
] as const

export interface ContabilidadPurchaseInvoiceDTO {
  id: string
  supplierId: string
  supplierRuc: string
  supplierName: string
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
  expenseAccountId: string
  expenseAccountCode: string
  expenseAccountName: string
  taxableBase: string
  igvAmount: string
  totalAmount: string
  detraccionAmount: string
  paidAmount: string
  balanceAmount: string
  status: string
  notes: string | null
  journalEntryId: string | null
  cancelledAt: string | null
  createdAt: string
}

export interface ContabilidadPurchaseCreditNoteDTO {
  id: string
  supplierId: string
  supplierRuc: string
  supplierName: string
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

export interface ContabilidadPurchasePaymentDTO {
  id: string
  invoiceId: string
  invoiceFullNumber: string
  supplierRuc: string
  supplierName: string
  periodId: string
  amount: string
  paymentDate: string
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

export interface CreateSupplierBody {
  ruc: string
  businessName: string
  countryCode?: string
  isNonDomiciled?: boolean
  tradeName?: string | null
  address?: string | null
  email?: string | null
  phone?: string | null
}

export interface UpdateSupplierBody {
  businessName?: string
  countryCode?: string
  isNonDomiciled?: boolean
  tradeName?: string | null
  address?: string | null
  email?: string | null
  phone?: string | null
  isActive?: boolean
}

export interface CreatePurchaseInvoiceBody {
  supplierId: string
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
  expenseAccountId: string
  taxableBase: number | string
  igvAmount?: number | string
  detraccionAmount?: number | string
  notes?: string | null
}

export interface ContabilidadPurchaseDebitNoteDTO {
  id: string
  supplierId: string
  supplierRuc: string
  supplierName: string
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

export interface CreatePurchaseCreditNoteBody {
  supplierId: string
  invoiceId?: string | null
  periodId: string
  series: string
  number: string
  issueDate: string
  taxableBase: number | string
  igvAmount?: number | string
  reason?: string | null
}

export interface CreatePurchaseDebitNoteBody {
  supplierId: string
  invoiceId?: string | null
  periodId: string
  series: string
  number: string
  issueDate: string
  taxableBase: number | string
  igvAmount?: number | string
  reason?: string | null
}

export interface CreatePurchasePaymentBody {
  invoiceId: string
  periodId: string
  amount: number | string
  paymentDate: string
  description: string
  sourceType: 'CASH' | 'BANK'
  cashBoxId?: string | null
  bankAccountId?: string | null
}

export interface ListPurchaseInvoicesParams {
  periodId?: string
  supplierId?: string
  status?: string
  search?: string
}

export interface ListSuppliersParams {
  search?: string
  activeOnly?: boolean
}

export function purchaseStatusVariant(status: string): 'success' | 'warning' | 'neutral' | 'error' {
  if (status === PURCHASE_STATUS.PAID) return 'success'
  if (status === PURCHASE_STATUS.PARTIAL) return 'warning'
  if (status === PURCHASE_STATUS.CANCELLED) return 'error'
  return 'neutral'
}
