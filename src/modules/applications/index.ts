export type { Application } from './domain/application.types'
export { applicationsService } from './infrastructure/applications.service'
export {
  applicationKeys,
  useMyApplications,
  useApplicationMenus,
} from './application/useApplications'
export { applicationsRoutes } from './presentation/router'

