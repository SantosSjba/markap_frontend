import { createServiceKey } from '@shared/application/ports/service-key'
import type { ApplicationsRepository } from '../../domain/repositories/applications.repository'
export const applicationsRepositoryKey = createServiceKey<ApplicationsRepository>(
  'applications.applications',
)
