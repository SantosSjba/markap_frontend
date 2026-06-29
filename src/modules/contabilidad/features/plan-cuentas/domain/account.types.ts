import { CONTABILIDAD_APP_SLUG } from '@modules/contabilidad/config/app.constants'

export const CONTABILIDAD_ACCOUNTS_APP_SLUG = CONTABILIDAD_APP_SLUG

export interface ContabilidadAccountDTO {
  id: string
  parentId: string | null
  code: string
  name: string
  level: number
  accountType: string
  isMovement: boolean
  isActive: boolean
  isSystem: boolean
  sortOrder: number
  hasMovements: boolean
  children?: ContabilidadAccountDTO[]
}

export interface ContabilidadAccountsTreeResponse {
  tree: ContabilidadAccountDTO[]
  flat: ContabilidadAccountDTO[]
  accountTypeLabels: Record<string, string>
}

export const CONTABILIDAD_ACCOUNT_TYPE_OPTIONS = [
  { value: 'ASSET', label: 'Activo' },
  { value: 'LIABILITY', label: 'Pasivo' },
  { value: 'EQUITY', label: 'Patrimonio' },
  { value: 'INCOME', label: 'Ingreso' },
  { value: 'EXPENSE', label: 'Gasto' },
  { value: 'MEMO', label: 'Orden' },
] as const

export interface CreateContabilidadAccountBody {
  parentId: string
  code: string
  name: string
  accountType: string
  isMovement: boolean
  sortOrder?: number
}

export interface UpdateContabilidadAccountBody {
  code?: string
  name?: string
  accountType?: string
  isMovement?: boolean
  sortOrder?: number
  isActive?: boolean
}
