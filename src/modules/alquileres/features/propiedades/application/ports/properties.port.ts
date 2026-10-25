import { createServiceKey } from '@shared/application/ports/service-key'
import type { PropertiesRepository } from '../../domain/repositories/properties.repository'
export const propertiesRepositoryKey = createServiceKey<PropertiesRepository>(
  'alquileres.features.propiedades.properties',
)
