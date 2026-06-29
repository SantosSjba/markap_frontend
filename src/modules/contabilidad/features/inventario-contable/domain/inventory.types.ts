export const CONTABILIDAD_INVENTORY_APP_SLUG = 'contabilidad'

export const INVENTORY_MOVEMENT_TYPE = {
  IN: 'IN',
  OUT: 'OUT',
  ADJUST: 'ADJUST',
} as const

export const INVENTORY_COST_METHOD = {
  PROMEDIO: 'PROMEDIO',
  PEPS: 'PEPS',
} as const

export const INVENTORY_OFFSET_TYPE = {
  PAYABLE: 'PAYABLE',
  EXPENSE: 'EXPENSE',
} as const

export const INVENTORY_MOVEMENT_TYPE_OPTIONS = [
  { value: '', label: 'Todos los tipos' },
  { value: INVENTORY_MOVEMENT_TYPE.IN, label: 'Entrada' },
  { value: INVENTORY_MOVEMENT_TYPE.OUT, label: 'Salida' },
  { value: INVENTORY_MOVEMENT_TYPE.ADJUST, label: 'Ajuste' },
]

export const INVENTORY_COST_METHOD_OPTIONS = [
  { value: INVENTORY_COST_METHOD.PROMEDIO, label: 'Promedio ponderado' },
  { value: INVENTORY_COST_METHOD.PEPS, label: 'PEPS (FIFO)' },
]

export const INVENTORY_OFFSET_TYPE_OPTIONS = [
  { value: INVENTORY_OFFSET_TYPE.PAYABLE, label: 'Cuentas por pagar (421)' },
  { value: INVENTORY_OFFSET_TYPE.EXPENSE, label: 'Gasto / compra (601)' },
]

export interface ContabilidadInventoryItemDTO {
  id: string
  code: string
  description: string
  accountId: string
  accountCode: string
  accountName: string
  unit: string
  costMethod: string
  quantityOnHand: string
  avgUnitCost: string
  valuedBalance: string
  isActive: boolean
}

export interface ContabilidadInventoryMovementDTO {
  id: string
  itemId: string
  itemCode: string
  itemDescription: string
  periodId: string
  movementType: string
  movementDate: string
  quantity: string
  unitCost: string
  totalAmount: string
  offsetType: string | null
  notes: string | null
  journalEntryId: string | null
  runningQuantity: string
  runningValue: string
  createdAt: string
}

export interface ContabilidadInventoryKardexLineDTO {
  id: string
  movementDate: string
  movementType: string
  quantity: string
  unitCost: string
  totalAmount: string
  runningQuantity: string
  runningValue: string
  notes: string | null
  journalEntryId: string | null
}

export interface ContabilidadInventoryValuedLineDTO {
  itemId: string
  itemCode: string
  description: string
  accountId: string
  accountCode: string
  accountName: string
  unit: string
  costMethod: string
  quantityOnHand: string
  avgUnitCost: string
  valuedBalance: string
}

export interface CreateInventoryItemBody {
  code: string
  description: string
  accountId: string
  unit?: string
  costMethod?: string
}

export interface CreateInventoryMovementBody {
  itemId: string
  periodId: string
  movementType: string
  movementDate: string
  quantity: number | string
  unitCost?: number | string
  offsetType?: string
  notes?: string | null
}
