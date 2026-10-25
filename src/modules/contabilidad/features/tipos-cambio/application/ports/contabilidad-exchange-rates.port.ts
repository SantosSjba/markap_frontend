import { createServiceKey } from '@shared/application/ports/service-key'
import type { ContabilidadExchangeRatesRepository } from '../../domain/repositories/contabilidad-exchange-rates.repository'
export const contabilidadExchangeRatesRepositoryKey =
  createServiceKey<ContabilidadExchangeRatesRepository>(
    'contabilidad.features.tipos-cambio.contabilidad-exchange-rates',
  )
