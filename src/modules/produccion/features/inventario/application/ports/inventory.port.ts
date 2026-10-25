import { createServiceKey } from '@shared/application/ports/service-key'
import type { ProduccionInventoryRepository } from '../../domain/repositories/inventory.repository'
export const produccionInventoryRepositoryKey = createServiceKey<ProduccionInventoryRepository>(
  'produccion.features.inventario.inventory',
)
