import { createServiceKey } from '@shared/application/ports/service-key'
import type { ProduccionCatalogRepository } from '../../domain/repositories/catalog.repository'
export const produccionCatalogRepositoryKey = createServiceKey<ProduccionCatalogRepository>(
  'produccion.features.catalogo.catalog',
)
