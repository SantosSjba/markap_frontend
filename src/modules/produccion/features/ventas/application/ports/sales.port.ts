import { createServiceKey } from '@shared/application/ports/service-key'
import type { ProduccionSalesRepository } from '../../domain/repositories/sales.repository'
export const produccionSalesRepositoryKey = createServiceKey<ProduccionSalesRepository>(
  'produccion.features.ventas.sales',
)
