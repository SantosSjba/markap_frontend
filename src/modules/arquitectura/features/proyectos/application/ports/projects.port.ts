import { createServiceKey } from '@shared/application/ports/service-key'
import type { ArquitecturaProjectsRepository } from '../../domain/repositories/projects.repository'
export const arquitecturaProjectsRepositoryKey = createServiceKey<ArquitecturaProjectsRepository>(
  'arquitectura.features.proyectos.projects',
)
