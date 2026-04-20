export type { Application } from './domain/application.types'
export type { ApplicationsRepository } from './domain/repositories/applications.repository'
export { applicationsApiRepository } from './infrastructure/repositories/applications.api.repository'
export {
  applicationKeys,
  useMyApplications,
  useApplicationMenus,
} from './application/useApplications'
export { applicationsRoutes } from './presentation/router'

