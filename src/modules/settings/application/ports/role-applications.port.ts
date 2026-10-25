import { createServiceKey } from '@shared/application/ports/service-key'
import type { RoleApplicationsRepository } from '../../domain/repositories/role-applications.repository'
export const roleApplicationsRepositoryKey = createServiceKey<RoleApplicationsRepository>(
  'settings.role-applications',
)
