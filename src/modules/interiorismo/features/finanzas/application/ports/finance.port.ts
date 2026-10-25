import { createServiceKey } from '@shared/application/ports/service-key'
import type { InteriorFinanceRepository } from '../../domain/repositories/finance.repository'
export const interiorFinanceRepositoryKey = createServiceKey<InteriorFinanceRepository>(
  'interiorismo.features.finanzas.finance',
)
