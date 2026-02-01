import { apiClient } from '@core/api'
import type { Application } from '../types'

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
}
