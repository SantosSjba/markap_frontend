export const CONTABILIDAD_TAXES_APP_SLUG = 'contabilidad'

export const DETRACTION_STATUS = {
  PENDING: 'PENDING',
  PAID: 'PAID',
} as const

export const RETENTION_TYPE = {
  IGV: 'IGV',
  RENTA: 'RENTA',
} as const

export const PERCEPTION_TYPE = {
  IGV: 'IGV',
} as const

export const DETRACTION_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  PAID: 'Pagada',
}

export const RETENTION_TYPE_LABELS: Record<string, string> = {
  IGV: 'Retención IGV',
  RENTA: 'Retención renta',
}

export const RETENTION_TYPE_OPTIONS = Object.entries(RETENTION_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}))

export const DETRACTION_STATUS_FILTER_OPTIONS = [
  { value: '', label: 'Todos' },
  ...Object.entries(DETRACTION_STATUS_LABELS).map(([value, label]) => ({ value, label })),
]

export interface ContabilidadIgvSummaryDTO {
  periodId: string
  year: number
  month: number
  igvPercent: number
  purchaseCreditIgv: string
  purchaseCreditNoteIgv: string
  salesDebitIgv: string
  salesCreditNoteIgv: string
  retentionsIgv: string
  perceptionsIgv: string
  netCreditIgv: string
  netDebitIgv: string
  balanceToPay: string
  balanceInFavor: string
}

export interface ContabilidadTaxDashboardDTO {
  igvPercent: number
  isDetractionAgent: boolean
  isRetentionAgent: boolean
  isPerceptionAgent: boolean
  summary: ContabilidadIgvSummaryDTO | null
  statusLabels?: Record<string, string>
  retentionTypeLabels?: Record<string, string>
  perceptionTypeLabels?: Record<string, string>
}

export interface ContabilidadPdt621ExportDTO {
  periodId: string
  year: number
  month: number
  ruc: string
  legalName: string
  igvSummary: ContabilidadIgvSummaryDTO
  detraccionesTotal: string
  retencionesTotal: string
  percepcionesTotal: string
  generatedAt: string
}

export interface ContabilidadDetraccionRateDTO {
  id: string
  sunatCode: string
  description: string
  ratePercent: string
  minAmount: string
  isActive: boolean
}

export interface ContabilidadDetraccionDTO {
  id: string
  periodId: string
  purchaseInvoiceId: string | null
  invoiceFullNumber: string | null
  rateId: string | null
  rateDescription: string | null
  supplierRuc: string
  supplierName: string
  certificateNumber: string
  operationDate: string
  baseAmount: string
  ratePercent: string
  amount: string
  status: string
  paidAt: string | null
  treasuryMovementId: string | null
  journalEntryId: string | null
  createdAt: string
}

export interface ContabilidadRetentionDTO {
  id: string
  periodId: string
  retentionType: string
  counterpartyRuc: string
  counterpartyName: string
  documentType: string | null
  documentSeries: string | null
  documentNumber: string | null
  fullDocument: string | null
  issueDate: string
  taxableBase: string
  ratePercent: string
  amount: string
  purchaseInvoiceId: string | null
  journalEntryId: string | null
  status: string
  createdAt: string
}

export interface ContabilidadPerceptionDTO {
  id: string
  periodId: string
  perceptionType: string
  customerRuc: string
  customerName: string
  salesInvoiceId: string | null
  invoiceFullNumber: string | null
  issueDate: string
  taxableBase: string
  ratePercent: string
  amount: string
  treasuryMovementId: string | null
  journalEntryId: string | null
  status: string
  createdAt: string
}

export interface CreateDetraccionBody {
  periodId: string
  purchaseInvoiceId?: string | null
  rateId?: string | null
  supplierRuc: string
  supplierName: string
  certificateNumber: string
  operationDate: string
  baseAmount: number | string
  ratePercent?: number | string
  amount?: number | string
}

export interface PayDetraccionBody {
  paymentDate: string
  description: string
  sourceType: 'CASH' | 'BANK'
  cashBoxId?: string | null
  bankAccountId?: string | null
}

export interface CreateRetentionBody {
  periodId: string
  retentionType: string
  counterpartyRuc: string
  counterpartyName: string
  documentType?: string | null
  documentSeries?: string | null
  documentNumber?: string | null
  issueDate: string
  taxableBase: number | string
  ratePercent?: number | string
  amount?: number | string
  purchaseInvoiceId?: string | null
}

export interface CreatePerceptionBody {
  periodId: string
  perceptionType: string
  customerRuc: string
  customerName: string
  salesInvoiceId?: string | null
  issueDate: string
  taxableBase: number | string
  ratePercent?: number | string
  amount?: number | string
  sourceType: 'CASH' | 'BANK'
  cashBoxId?: string | null
  bankAccountId?: string | null
  description: string
}

export function detraccionStatusVariant(status: string): 'success' | 'warning' | 'neutral' {
  if (status === DETRACTION_STATUS.PAID) return 'success'
  return 'warning'
}
