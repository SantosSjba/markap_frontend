export const CONTABILIDAD_JOURNAL_APP_SLUG = 'contabilidad'

export const CONTABILIDAD_JOURNAL_STATUS = {
  DRAFT: 'DRAFT',
  POSTED: 'POSTED',
  REVERSED: 'REVERSED',
} as const

export type ContabilidadJournalStatus =
  (typeof CONTABILIDAD_JOURNAL_STATUS)[keyof typeof CONTABILIDAD_JOURNAL_STATUS]

export const CONTABILIDAD_JOURNAL_STATUS_LABELS: Record<ContabilidadJournalStatus, string> = {
  DRAFT: 'Borrador',
  POSTED: 'Publicado',
  REVERSED: 'Reversado',
}

export interface ContabilidadJournalLineDTO {
  id: string
  lineNumber: number
  accountId: string
  accountCode: string
  accountName: string
  debit: string
  credit: string
  foreignCurrency: string | null
  foreignAmount: string | null
  exchangeRate: string | null
  costCenterId: string | null
  costCenterCode: string | null
  costCenterName: string | null
  auxiliaryRuc: string | null
  auxiliaryDoc: string | null
  description: string | null
}

export interface ContabilidadJournalEntryListItemDTO {
  id: string
  periodId: string
  entryNumber: number
  entryDate: string
  description: string
  status: ContabilidadJournalStatus | string
  totalDebit: string
  totalCredit: string
  lineCount: number
  postedAt: string | null
  reversalOfId: string | null
}

export interface ContabilidadJournalEntryDetailDTO extends ContabilidadJournalEntryListItemDTO {
  lines: ContabilidadJournalLineDTO[]
  createdAt: string
  updatedAt: string
}

export interface ContabilidadJournalListResponse {
  entries: ContabilidadJournalEntryListItemDTO[]
  statusLabels: Record<string, string>
}

export interface ContabilidadJournalDetailResponse {
  entry: ContabilidadJournalEntryDetailDTO
  statusLabels: Record<string, string>
}

export interface ContabilidadJournalLineBody {
  accountId: string
  debit?: number | string
  credit?: number | string
  foreignCurrency?: string | null
  foreignAmount?: number | string | null
  exchangeRate?: number | string | null
  costCenterId?: string | null
  auxiliaryRuc?: string | null
  auxiliaryDoc?: string | null
  description?: string | null
}

export interface CreateContabilidadJournalBody {
  periodId: string
  entryDate: string
  description: string
  lines: ContabilidadJournalLineBody[]
}

export interface UpdateContabilidadJournalBody {
  entryDate?: string
  description?: string
  lines?: ContabilidadJournalLineBody[]
}

export interface ListContabilidadJournalParams {
  periodId?: string
  status?: string
  dateFrom?: string
  dateTo?: string
  accountId?: string
  costCenterId?: string
  search?: string
}

export interface JournalLineFormRow {
  key: string
  accountId: string
  debit: string
  credit: string
  foreignCurrency: string
  foreignAmount: string
  exchangeRate: string
  costCenterId: string
  auxiliaryRuc: string
  auxiliaryDoc: string
  description: string
}

export const CONTABILIDAD_JOURNAL_STATUS_FILTER_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'DRAFT', label: 'Borrador' },
  { value: 'POSTED', label: 'Publicado' },
  { value: 'REVERSED', label: 'Reversado' },
]
