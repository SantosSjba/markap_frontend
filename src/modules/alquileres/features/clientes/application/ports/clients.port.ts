import { createServiceKey } from '@shared/application/ports/service-key'
import type { ClientsRepository } from '../../domain/repositories/clients.repository'
export const clientsRepositoryKey = createServiceKey<ClientsRepository>(
  'alquileres.features.clientes.clients',
)
