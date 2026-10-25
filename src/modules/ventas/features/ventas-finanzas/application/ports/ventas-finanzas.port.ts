import { createServiceKey } from '@shared/application/ports/service-key'
import type { VentasFinanzasRepository } from '../../domain/repositories/ventas-finanzas.repository'
export const ventasFinanzasRepositoryKey = createServiceKey<VentasFinanzasRepository>(
  'ventas.features.ventas-finanzas.ventas-finanzas',
)
