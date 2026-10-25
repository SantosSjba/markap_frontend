import { createServiceKey } from '@shared/application/ports/service-key'
import type { AuthRepository } from '../../domain/repositories/auth.repository'
export const authRepositoryKey = createServiceKey<AuthRepository>('auth.auth')
