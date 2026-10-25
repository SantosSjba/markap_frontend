import { createServiceKey } from '@shared/application/ports/service-key'
import type { ProduccionWorkOrdersRepository } from '../../domain/repositories/work-orders.repository'
export const produccionWorkOrdersRepositoryKey = createServiceKey<ProduccionWorkOrdersRepository>(
  'produccion.features.taller.work-orders',
)
