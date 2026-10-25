import type {
  CreateMaterialPayload,
  CreateMovementPayload,
  ListMaterialsParams,
  ListMovementsParams,
  ProduccionInventoryStats,
  ProduccionMaterial,
  ProduccionStockMovement,
  UpdateMaterialPayload,
} from '../inventory.types'
export interface ProduccionInventoryRepository {
  listMaterials: (
    params?: ListMaterialsParams,
  ) => Promise<{ data: ProduccionMaterial[]; total: number }>
  getStats: () => Promise<ProduccionInventoryStats>
  getMaterial: (id: string) => Promise<ProduccionMaterial>
  createMaterial: (payload: CreateMaterialPayload) => Promise<ProduccionMaterial>
  updateMaterial: (id: string, payload: UpdateMaterialPayload) => Promise<ProduccionMaterial>
  deleteMaterial: (id: string) => Promise<undefined>
  listMovements: (
    params?: ListMovementsParams,
  ) => Promise<{ data: ProduccionStockMovement[]; total: number }>
  createMovement: (payload: CreateMovementPayload) => Promise<ProduccionStockMovement>
}
