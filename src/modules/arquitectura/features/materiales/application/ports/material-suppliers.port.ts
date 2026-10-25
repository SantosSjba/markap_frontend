import { createServiceKey } from '@shared/application/ports/service-key'
import type { ArquitecturaMaterialSuppliersRepository } from '../../domain/repositories/materialSuppliers.repository'
export const arquitecturaMaterialSuppliersRepositoryKey =
  createServiceKey<ArquitecturaMaterialSuppliersRepository>(
    'arquitectura.features.materiales.material-suppliers',
  )
