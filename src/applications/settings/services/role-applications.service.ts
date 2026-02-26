import { apiClient } from '@app/api/apiClient'
import type { RoleInfo } from '../types'

export interface ApplicationItem {
  id: string
  name: string
  slug: string
  description?: string | null
  icon?: string | null
  color?: string | null
  order?: number
}

/**
 * Role-Applications Service
 * Gestión de qué roles tienen acceso a qué aplicaciones
 */
export const roleApplicationsService = {
  /** Listar todos los roles */
  getRoles(): Promise<RoleInfo[]> {
    return apiClient.get<RoleInfo[]>('/roles').then((r) => r.data)
  },

  /** Listar todas las aplicaciones (admin) */
  getAllApplications(): Promise<ApplicationItem[]> {
    return apiClient.get<ApplicationItem[]>('/applications').then((r) => r.data)
  },

  /** Aplicaciones asignadas a un rol */
  getRoleApplications(roleId: string): Promise<ApplicationItem[]> {
    return apiClient
      .get<ApplicationItem[]>(`/roles/${roleId}/applications`)
      .then((r) => r.data)
  },

  /** Asignar aplicación a un rol */
  assignApplication(roleId: string, applicationId: string): Promise<void> {
    return apiClient
      .post(`/roles/${roleId}/applications/${applicationId}`)
      .then(() => undefined)
  },

  /** Revocar aplicación de un rol */
  revokeApplication(roleId: string, applicationId: string): Promise<void> {
    return apiClient
      .delete(`/roles/${roleId}/applications/${applicationId}`)
      .then(() => undefined)
  },
}
