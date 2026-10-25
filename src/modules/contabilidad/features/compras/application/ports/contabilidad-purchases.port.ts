import { createServiceKey } from '@shared/application/ports/service-key'
import type { ContabilidadPurchasesRepository } from '../../domain/repositories/contabilidad-purchases.repository'
export const contabilidadPurchasesRepositoryKey = createServiceKey<ContabilidadPurchasesRepository>(
  'contabilidad.features.compras.contabilidad-purchases',
)
