import { createServiceKey } from '@shared/application/ports/service-key'
import type { VentasSalesRepository } from '../../domain/repositories/ventas-sales.repository'
export const ventasSalesRepositoryKey = createServiceKey<VentasSalesRepository>(
  'ventas.features.ventas-sales.ventas-sales',
)
