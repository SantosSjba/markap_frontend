import { apiClient } from '@core/api'
import type { Application } from '../types'
import type { MenuItem } from '@shared/types'

/**
 * Applications Service
 */

export const applicationsService = {
  /**
   * Get applications for the authenticated user
   */
  async getMyApplications(): Promise<Application[]> {
    const { data } = await apiClient.get<Application[]>('/applications/me')
    return data
  },

  /**
   * Get menus for an application by slug
   */
  async getMenus(slug: string): Promise<MenuItem[]> {
    const { data } = await apiClient.get<MenuItem[]>(`/applications/${slug}/menus`)
    return data
  },
}
