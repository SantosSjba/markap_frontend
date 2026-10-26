import type { ApplicationItem, RoleInfo, AccessLevel, RoleApplicationsMatrix } from '../settings.types'
export interface RoleApplicationsRepository {
  getMatrix(): Promise<RoleApplicationsMatrix>
  setAccess(roleId:string, applicationId:string, level:AccessLevel):Promise<void>
  getRoles(): Promise<RoleInfo[]>
  getAllApplications(): Promise<ApplicationItem[]>
  getRoleApplications(roleId: string): Promise<ApplicationItem[]>
  assignApplication(roleId: string, applicationId: string): Promise<void>
  revokeApplication(roleId: string, applicationId: string): Promise<void>
}
