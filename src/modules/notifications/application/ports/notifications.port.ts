import { createServiceKey } from '@shared/application/ports/service-key'
import type { NotificationsRepository } from '../../domain/repositories/notifications.repository'
export const notificationsRepositoryKey = createServiceKey<NotificationsRepository>(
  'notifications.notifications',
)
