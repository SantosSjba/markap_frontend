import { createServiceKey } from '@shared/application/ports/service-key'
import type { VentasClientsRepository } from '../../domain/repositories/ventas-clients.repository'
export const ventasClientsRepositoryKey = createServiceKey<VentasClientsRepository>(
  'ventas.features.clientes.ventas-clients',
)
