import { createServiceKey } from '@shared/application/ports/service-key'
import type { ContabilidadSalesRepository } from '../../domain/repositories/contabilidad-sales.repository'
export const contabilidadSalesRepositoryKey = createServiceKey<ContabilidadSalesRepository>(
  'contabilidad.features.ventas-contables.contabilidad-sales',
)
