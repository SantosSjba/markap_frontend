import { apiClient } from '@core/api/apiClient'
import type { ApplicationItem, RoleInfo } from '../domain/settings.types'

export const roleApplicationsService = {
  getRoles(): Promise<RoleInfo[]> {
    return apiClient.get<RoleInfo[]>('/roles').then((r) => r.data)
  },

  getAllApplications(): Promise<ApplicationItem[]> {
    return apiClient.get<ApplicationItem[]>('/applications').then((r) => r.data)
  },

  getRoleApplications(roleId: string): Promise<ApplicationItem[]> {
    return apiClient
      .get<ApplicationItem[]>(`/roles/${roleId}/applications`)
      .then((r) => r.data)
  },

  assignApplication(roleId: string, applicationId: string): Promise<void> {
    return apiClient
      .post(`/roles/${roleId}/applications/${applicationId}`)
      .then(() => undefined)
  },

  revokeApplication(roleId: string, applicationId: string): Promise<void> {
    return apiClient
      .delete(`/roles/${roleId}/applications/${applicationId}`)
      .then(() => undefined)
  },
}
