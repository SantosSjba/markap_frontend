export interface ProduccionLaborRate {
  id: string
  name: string
  stage: string
  hourlyRate: number
  isActive: boolean
  updatedAt: string
}

export interface ProduccionExtraCostCatalogItem {
  id: string
  name: string
  defaultAmount: number
  description: string | null
  isActive: boolean
  updatedAt: string
}

export interface CostingMaterialLine {
  id: string
  materialName: string
  unit: string
  quantity: number
  unitCost: number | null
  lineTotal: number
}

export interface CostingLaborLine {
  id: string
  laborRateId: string | null
  description: string
  hours: number
  hourlyRate: number
  lineTotal: number
}

export interface CostingExtraLine {
  id: string
  catalogItemId: string | null
  description: string
  amount: number
}

export interface CostingTotals {
  materials: number
  labor: number
  extras: number
  totalCost: number
  referencePrice: number
  marginAmount: number
  marginPercent: number | null
}

export interface CostingSnapshot {
  id: string
  label: string | null
  materialsTotal: number
  laborTotal: number
  extrasTotal: number
  totalCost: number
  referencePrice: number
  marginPercent: number | null
  createdAt: string
}

export interface FurnitureCostingDetail {
  furnitureId: string
  furnitureCode: string
  furnitureName: string
  referencePrice: number
  materials: CostingMaterialLine[]
  laborEntries: CostingLaborLine[]
  extraExpenses: CostingExtraLine[]
  totals: CostingTotals
  recentSnapshots: CostingSnapshot[]
}

export interface UpdateFurnitureCostingPayload {
  bomUnitCosts?: { id: string; unitCost: number | null }[]
  laborEntries?: {
    laborRateId?: string | null
    description: string
    hours: number
    hourlyRate?: number
  }[]
  extraExpenses?: {
    catalogItemId?: string | null
    description: string
    amount: number
  }[]
}

export interface ListLaborRatesParams {
  page?: number
  limit?: number
  search?: string
  isActive?: boolean
}

export interface ListExtraCostsParams {
  page?: number
  limit?: number
  search?: string
  isActive?: boolean
}
