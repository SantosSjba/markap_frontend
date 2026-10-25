import { createServiceKey } from '@shared/application/ports/service-key'
import type { InteriorMaterialSuppliersRepository } from '../../domain/repositories/materialSuppliers.repository'
export const interiorMaterialSuppliersRepositoryKey =
  createServiceKey<InteriorMaterialSuppliersRepository>(
    'interiorismo.features.materiales.material-suppliers',
  )
