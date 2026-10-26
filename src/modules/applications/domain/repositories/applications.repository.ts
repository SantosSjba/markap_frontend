import type { Application } from '../application.types'
export interface ApplicationsRepository {
  getMyApplications(): Promise<Application[]>
}
