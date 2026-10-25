import type {
  FurnitureCostingDetail,
  ListExtraCostsParams,
  ListLaborRatesParams,
  ProduccionExtraCostCatalogItem,
  ProduccionLaborRate,
  UpdateFurnitureCostingPayload,
  CostingSnapshot,
} from '../costs.types'
export interface ProduccionCostsRepository {
  listLaborRates: (
    params?: ListLaborRatesParams,
  ) => Promise<{ data: ProduccionLaborRate[]; total: number }>
  createLaborRate: (
    payload: Omit<ProduccionLaborRate, 'id' | 'updatedAt'>,
  ) => Promise<ProduccionLaborRate>
  updateLaborRate: (
    id: string,
    payload: Partial<ProduccionLaborRate>,
  ) => Promise<ProduccionLaborRate>
  deleteLaborRate: (id: string) => Promise<undefined>
  listExtraCosts: (
    params?: ListExtraCostsParams,
  ) => Promise<{ data: ProduccionExtraCostCatalogItem[]; total: number }>
  createExtraCost: (payload: {
    name: string
    defaultAmount: number
    description?: string | null
    isActive?: boolean
  }) => Promise<ProduccionExtraCostCatalogItem>
  updateExtraCost: (
    id: string,
    payload: Partial<ProduccionExtraCostCatalogItem>,
  ) => Promise<ProduccionExtraCostCatalogItem>
  deleteExtraCost: (id: string) => Promise<undefined>
  getCosting: (furnitureId: string) => Promise<FurnitureCostingDetail>
  updateCosting: (
    furnitureId: string,
    payload: UpdateFurnitureCostingPayload,
  ) => Promise<FurnitureCostingDetail>
  createSnapshot: (furnitureId: string, label?: string) => Promise<CostingSnapshot>
}
