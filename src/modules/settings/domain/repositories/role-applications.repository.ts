import type { ApplicationItem, RoleInfo } from '../settings.types'

export interface RoleApplicationsRepository {
  getRoles(): Promise<RoleInfo[]>
  getAllApplications(): Promise<ApplicationItem[]>
  getRoleApplications(roleId: string): Promise<ApplicationItem[]>
  assignApplication(roleId: string, applicationId: string): Promise<void>
  revokeApplication(roleId: string, applicationId: string): Promise<void>
}
