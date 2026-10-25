import { createServiceKey } from '@shared/application/ports/service-key'
import type { ArquitecturaBudgetsRepository } from '../../domain/repositories/budgets.repository'
export const arquitecturaBudgetsRepositoryKey = createServiceKey<ArquitecturaBudgetsRepository>(
  'arquitectura.features.presupuestos.budgets',
)
