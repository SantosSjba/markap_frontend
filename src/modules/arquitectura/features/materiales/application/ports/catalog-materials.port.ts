import { createServiceKey } from '@shared/application/ports/service-key'
import type { ArquitecturaCatalogMaterialsRepository } from '../../domain/repositories/catalogMaterials.repository'
export const arquitecturaCatalogMaterialsRepositoryKey =
  createServiceKey<ArquitecturaCatalogMaterialsRepository>(
    'arquitectura.features.materiales.catalog-materials',
  )
