import { createServiceKey } from '@shared/application/ports/service-key'
import type { VentasPropertiesRepository } from '../../domain/repositories/ventas-properties.repository'
export const ventasPropertiesRepositoryKey = createServiceKey<VentasPropertiesRepository>(
  'ventas.features.propiedades.ventas-properties',
)
