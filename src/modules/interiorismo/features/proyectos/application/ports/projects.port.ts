import { createServiceKey } from '@shared/application/ports/service-key'
import type { InteriorProjectsRepository } from '../../domain/repositories/projects.repository'
export const interiorProjectsRepositoryKey = createServiceKey<InteriorProjectsRepository>(
  'interiorismo.features.proyectos.projects',
)
