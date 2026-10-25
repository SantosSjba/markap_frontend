import { createServiceKey } from '@shared/application/ports/service-key'
import type { ArquitecturaFinanceRepository } from '../../domain/repositories/finance.repository'
export const arquitecturaFinanceRepositoryKey = createServiceKey<ArquitecturaFinanceRepository>(
  'arquitectura.features.finanzas.finance',
)
