import { createServiceKey } from '@shared/application/ports/service-key'
import type { VentasConfigRepository } from '../../domain/repositories/ventas-config.repository'
export const ventasConfigRepositoryKey = createServiceKey<VentasConfigRepository>(
  'ventas.features.ventas-configuracion.ventas-config',
)
