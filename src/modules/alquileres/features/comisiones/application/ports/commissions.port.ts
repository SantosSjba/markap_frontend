import { createServiceKey } from '@shared/application/ports/service-key'
import type { CommissionsRepository } from '../../domain/repositories/commissions.repository'
export const commissionsRepositoryKey = createServiceKey<CommissionsRepository>(
  'alquileres.features.comisiones.commissions',
)
