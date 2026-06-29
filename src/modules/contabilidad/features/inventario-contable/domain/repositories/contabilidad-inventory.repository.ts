import type {
  ContabilidadInventoryItemDTO,
  ContabilidadInventoryKardexLineDTO,
  ContabilidadInventoryMovementDTO,
  ContabilidadInventoryValuedLineDTO,
  CreateInventoryItemBody,
  CreateInventoryMovementBody,
} from '../inventory.types'

export interface ContabilidadInventoryRepository {
  getCatalog(): Promise<{
    movementTypeLabels: Record<string, string>
    costMethodLabels: Record<string, string>
    offsetTypeLabels: Record<string, string>
  }>
  listItems(params: Record<string, string | undefined>): Promise<{ items: ContabilidadInventoryItemDTO[] }>
  createItem(body: CreateInventoryItemBody): Promise<ContabilidadInventoryItemDTO>
  listMovements(params: Record<string, string | undefined>): Promise<{ movements: ContabilidadInventoryMovementDTO[] }>
  createMovement(body: CreateInventoryMovementBody): Promise<ContabilidadInventoryMovementDTO>
  getKardex(itemId: string): Promise<{ item: ContabilidadInventoryItemDTO; lines: ContabilidadInventoryKardexLineDTO[] }>
  getValuedBalance(): Promise<{ lines: ContabilidadInventoryValuedLineDTO[]; totalValue: string }>
}
