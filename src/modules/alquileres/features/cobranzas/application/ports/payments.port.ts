import { createServiceKey } from '@shared/application/ports/service-key'
import type { PaymentsRepository } from '../../domain/repositories/payments.repository'
export const paymentsRepositoryKey = createServiceKey<PaymentsRepository>(
  'alquileres.features.cobranzas.payments',
)
