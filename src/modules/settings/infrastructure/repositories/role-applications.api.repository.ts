import { apiClient } from '@shared/infrastructure/http/api-client'
import type { ApplicationItem, RoleInfo, AccessLevel, RoleApplicationsMatrix } from '../../domain/settings.types'
import type { RoleApplicationsRepository } from '../../domain/repositories/role-applications.repository'
export const roleApplicationsApiRepository: RoleApplicationsRepository = {
  getMatrix(){return apiClient.get<RoleApplicationsMatrix>('/roles/applications-matrix').then(r=>r.data)},
  setAccess(roleId:string,applicationId:string,level:AccessLevel){return apiClient.put(`/roles/${roleId}/applications/${applicationId}`,{accessLevel:level}).then(()=>undefined)},
  getRoles(): Promise<RoleInfo[]> {
    return apiClient.get<RoleInfo[]>('/roles').then((r) => r.data)
  },

  getAllApplications(): Promise<ApplicationItem[]> {
    return apiClient.get<ApplicationItem[]>('/applications').then((r) => r.data)
  },

  getRoleApplications(roleId: string): Promise<ApplicationItem[]> {
    return apiClient.get<ApplicationItem[]>(`/roles/${roleId}/applications`).then((r) => r.data)
  },

  assignApplication(roleId: string, applicationId: string): Promise<void> {
    return apiClient.post(`/roles/${roleId}/applications/${applicationId}`).then(() => undefined)
  },

  revokeApplication(roleId: string, applicationId: string): Promise<void> {
    return apiClient.delete(`/roles/${roleId}/applications/${applicationId}`).then(() => undefined)
  },
}
