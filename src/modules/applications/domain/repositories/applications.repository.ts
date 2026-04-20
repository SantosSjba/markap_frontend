import type { Application } from '../application.types'
import type { MenuItem } from '@shared/domain'

export interface ApplicationsRepository {
  getMyApplications(): Promise<Application[]>
  getMenus(slug: string): Promise<MenuItem[]>
}
