import { createServiceKey } from '@shared/application/ports/service-key'
import type { InteriorClientsRepository } from '../../domain/repositories/clients.repository'
export const interiorClientsRepositoryKey = createServiceKey<InteriorClientsRepository>(
  'interiorismo.features.clientes.clients',
)
