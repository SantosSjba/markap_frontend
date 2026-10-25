import { createServiceKey } from '@shared/application/ports/service-key'
import type { ProduccionClientsRepository } from '../../domain/repositories/clients.repository'
export const produccionClientsRepositoryKey = createServiceKey<ProduccionClientsRepository>(
  'produccion.features.clientes.clients',
)
