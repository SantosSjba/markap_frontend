import { createServiceKey } from '@shared/application/ports/service-key'
import type { ProduccionPurchasesRepository } from '../../domain/repositories/purchases.repository'
export const produccionPurchasesRepositoryKey = createServiceKey<ProduccionPurchasesRepository>(
  'produccion.features.compras.purchases',
)
