import { createServiceKey } from '@shared/application/ports/service-key'
import type { ArquitecturaClientsRepository } from '../../domain/repositories/clients.repository'
export const arquitecturaClientsRepositoryKey = createServiceKey<ArquitecturaClientsRepository>(
  'arquitectura.features.clientes.clients',
)
