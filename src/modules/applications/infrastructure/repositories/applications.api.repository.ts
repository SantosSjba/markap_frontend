import { apiClient } from '@shared/infrastructure/http/api-client'
import type { Application } from '../../domain/application.types'
import type { MenuItem } from '@shared/domain/menu.types'
import type { ApplicationsRepository } from '../../domain/repositories/applications.repository'
export const applicationsApiRepository: ApplicationsRepository = {
  async getMyApplications(): Promise<Application[]> {
    const { data } = await apiClient.get<Application[]>('/applications/me')
    return data
  },

  async getMenus(slug: string): Promise<MenuItem[]> {
    const { data } = await apiClient.get<MenuItem[]>(`/applications/${slug}/menus`)
    return data
  },
}
