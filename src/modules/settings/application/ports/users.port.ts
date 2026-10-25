import { createServiceKey } from '@shared/application/ports/service-key'
import type { UsersRepository } from '../../domain/repositories/users.repository'
export const usersRepositoryKey = createServiceKey<UsersRepository>('settings.users')
