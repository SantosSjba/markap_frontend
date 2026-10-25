import { installRepositories } from './repositories'
import { authRepositoryKey as AUTH } from '@modules/auth/application/ports/auth.port'
import { authApiRepository } from '@modules/auth/infrastructure/repositories/auth.api.repository'
import { notificationsRepositoryKey as NOTIFICATIONS } from '@modules/notifications/application/ports/notifications.port'
import { NOTIFICATION_CONNECTION } from '@modules/notifications/application/ports/notification-connection.port'
import { notificationsApiRepository } from '@modules/notifications/infrastructure/repositories/notifications.api.repository'
import { notificationConnectionAdapter } from '@modules/notifications/infrastructure/notifications.socket'
import type { App } from 'vue'
import { DIRECTORY } from '@shared/application/ports/directory.port'
import { FILE_ACCESS } from '@shared/application/ports/file-access.port'
import { directoryApiAdapter } from '@shared/infrastructure/http/directory.api.adapter'
import { fileAccessApiAdapter } from '@shared/infrastructure/http/file-access.api.adapter'
import { provideService } from '@shared/presentation/di/services'
/** Composition root: registers replaceable adapters once per Vue application. */
export function installServices(app: App): void {
  installRepositories(app)
  provideService(app, AUTH, authApiRepository)
  provideService(app, NOTIFICATIONS, notificationsApiRepository)
  provideService(app, NOTIFICATION_CONNECTION, notificationConnectionAdapter)
  provideService(app, DIRECTORY, directoryApiAdapter)
  provideService(app, FILE_ACCESS, fileAccessApiAdapter)
}
