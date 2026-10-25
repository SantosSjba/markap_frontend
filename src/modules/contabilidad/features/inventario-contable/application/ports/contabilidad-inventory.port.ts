import { createServiceKey } from '@shared/application/ports/service-key'
import type { ContabilidadInventoryRepository } from '../../domain/repositories/contabilidad-inventory.repository'
export const contabilidadInventoryRepositoryKey = createServiceKey<ContabilidadInventoryRepository>(
  'contabilidad.features.inventario-contable.contabilidad-inventory',
)
