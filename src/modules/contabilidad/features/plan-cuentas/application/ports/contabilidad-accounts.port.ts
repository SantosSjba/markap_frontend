import { createServiceKey } from '@shared/application/ports/service-key'
import type { ContabilidadAccountsRepository } from '../../domain/repositories/contabilidad-accounts.repository'
export const contabilidadAccountsRepositoryKey = createServiceKey<ContabilidadAccountsRepository>(
  'contabilidad.features.plan-cuentas.contabilidad-accounts',
)
