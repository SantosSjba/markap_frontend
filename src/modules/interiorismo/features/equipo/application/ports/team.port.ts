import { createServiceKey } from '@shared/application/ports/service-key'
import type { InteriorTeamRepository } from '../../domain/repositories/team.repository'
export const interiorTeamRepositoryKey = createServiceKey<InteriorTeamRepository>(
  'interiorismo.features.equipo.team',
)
