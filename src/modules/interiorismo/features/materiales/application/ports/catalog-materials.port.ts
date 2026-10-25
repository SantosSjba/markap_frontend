import { createServiceKey } from '@shared/application/ports/service-key'
import type { InteriorCatalogMaterialsRepository } from '../../domain/repositories/catalogMaterials.repository'
export const interiorCatalogMaterialsRepositoryKey =
  createServiceKey<InteriorCatalogMaterialsRepository>(
    'interiorismo.features.materiales.catalog-materials',
  )
