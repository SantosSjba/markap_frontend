export const CONTABILIDAD_TREASURY_APP_SLUG = 'contabilidad'

export const TREASURY_SOURCE_TYPE = {
  CASH: 'CASH',
  BANK: 'BANK',
} as const

export const TREASURY_MOVEMENT_TYPE = {
  IN: 'IN',
  OUT: 'OUT',
  TRANSFER_OUT: 'TRANSFER_OUT',
  TRANSFER_IN: 'TRANSFER_IN',
} as const

export const TREASURY_MOVEMENT_TYPE_LABELS: Record<string, string> = {
  IN: 'Ingreso',
  OUT: 'Egreso',
  TRANSFER_OUT: 'Transferencia (salida)',
  TRANSFER_IN: 'Transferencia (ingreso)',
}

export const TREASURY_SOURCE_TYPE_LABELS: Record<string, string> = {
  CASH: 'Caja',
  BANK: 'Banco',
}

export interface ContabilidadCashBoxDTO {
  id: string
  accountId: string
  accountCode: string
  accountName: string
  code: string
  name: string
  isActive: boolean
  balance: string
}

export interface ContabilidadBankAccountDTO {
  id: string
  accountId: string
  accountCode: string
  accountName: string
  code: string
  bankName: string
  accountNumber: string
  cci: string | null
  currency: string
  isActive: boolean
  balance: string
}

export interface ContabilidadTreasuryMovementDTO {
  id: string
  periodId: string
  movementType: string
  sourceType: string
  cashBoxId: string | null
  cashBoxCode: string | null
  cashBoxName: string | null
  bankAccountId: string | null
  bankCode: string | null
  bankName: string | null
  offsetAccountId: string | null
  offsetAccountCode: string | null
  offsetAccountName: string | null
  transferGroupId: string | null
  currencyCode: string
  foreignAmount: string | null
  exchangeRate: string | null
  amount: string
  movementDate: string
  description: string
  journalEntryId: string | null
  reconciliationId: string | null
  reconciledAt: string | null
  createdAt: string
}

export interface ContabilidadBankReconciliationDTO {
  id: string
  bankAccountId: string
  bankCode: string
  bankName: string
  periodId: string
  statementBalance: string
  bookBalance: string
  difference: string
  reconciledCount: number
  pendingCount: number
  notes: string | null
  status: string
  closedAt: string | null
}

export interface CreateTreasuryMovementBody {
  periodId: string
  movementType: 'IN' | 'OUT'
  sourceType: 'CASH' | 'BANK'
  cashBoxId?: string | null
  bankAccountId?: string | null
  offsetAccountId: string
  amount: number | string
  movementDate: string
  description: string
}

export interface CreateTreasuryTransferBody {
  periodId: string
  fromType: 'CASH' | 'BANK'
  fromCashBoxId?: string | null
  fromBankAccountId?: string | null
  toType: 'CASH' | 'BANK'
  toCashBoxId?: string | null
  toBankAccountId?: string | null
  amount: number | string
  movementDate: string
  description: string
}

export interface ListTreasuryMovementsParams {
  periodId?: string
  cashBoxId?: string
  bankAccountId?: string
  movementType?: string
  sourceType?: string
  search?: string
}

export const TREASURY_MOVEMENT_FILTER_OPTIONS = [
  { value: '', label: 'Todos los tipos' },
  { value: 'IN', label: 'Ingresos' },
  { value: 'OUT', label: 'Egresos' },
  { value: 'TRANSFER_OUT', label: 'Transferencias (salida)' },
  { value: 'TRANSFER_IN', label: 'Transferencias (ingreso)' },
]

export const TREASURY_SOURCE_FILTER_OPTIONS = [
  { value: '', label: 'Todos los medios' },
  { value: 'CASH', label: 'Caja' },
  { value: 'BANK', label: 'Banco' },
]
