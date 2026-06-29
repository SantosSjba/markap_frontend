export type ProduccionStockMovementType = 'IN' | 'OUT' | 'ADJUST'

export interface ProduccionMaterial {
  id: string
  code: string
  name: string
  category: string
  unit: string
  unitCost: number
  minStockQty: number
  currentStock: number
  isActive: boolean
  isLowStock: boolean
  updatedAt: string
  notes?: string | null
}

export interface ProduccionInventoryStats {
  totalMaterials: number
  activeMaterials: number
  lowStockCount: number
  totalStockValue: number
}

export interface ProduccionStockMovement {
  id: string
  materialId: string
  materialCode: string
  materialName: string
  movementType: ProduccionStockMovementType
  quantity: number
  balanceAfter: number
  unitCost: number | null
  reference: string | null
  notes: string | null
  createdAt: string
}

export interface ListMaterialsParams {
  page?: number
  limit?: number
  search?: string
  category?: string
  isActive?: boolean
  lowStockOnly?: boolean
}

export interface ListMovementsParams {
  page?: number
  limit?: number
  materialId?: string
  movementType?: ProduccionStockMovementType
  search?: string
}

export interface CreateMaterialPayload {
  code: string
  name: string
  category: string
  unit: string
  unitCost?: number
  minStockQty?: number
  isActive?: boolean
  notes?: string | null
}

export interface UpdateMaterialPayload {
  name?: string
  category?: string
  unit?: string
  unitCost?: number
  minStockQty?: number
  isActive?: boolean
  notes?: string | null
}

export interface CreateMovementPayload {
  materialId: string
  movementType: ProduccionStockMovementType
  quantity: number
  unitCost?: number | null
  reference?: string | null
  notes?: string | null
}
