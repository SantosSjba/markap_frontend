import { apiClient } from '@core/api/apiClient'
import type { Application } from '../domain/application.types'
import type { MenuItem } from '@shared/types'

/**
 * Applications API adapter
 */

export const applicationsService = {
  async getMyApplications(): Promise<Application[]> {
    const { data } = await apiClient.get<Application[]>('/applications/me')
    return data
  },

  async getMenus(slug: string): Promise<MenuItem[]> {
    const { data } = await apiClient.get<MenuItem[]>(`/applications/${slug}/menus`)
    return data
  },
}
