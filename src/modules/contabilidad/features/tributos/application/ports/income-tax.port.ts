import { createServiceKey } from '@shared/application/ports/service-key'
import type { IncomeTaxRepository } from '../../domain/repositories/income-tax.repository'
export const incomeTaxRepositoryKey = createServiceKey<IncomeTaxRepository>(
  'contabilidad.tributos.income-tax',
)
