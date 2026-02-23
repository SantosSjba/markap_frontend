import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { roleApplicationsService } from '../services'
import type { ApplicationItem } from '../services/role-applications.service'
import type { RoleInfo } from '../types'

/**
 * Query keys for Role-Applications (settings)
 */
export const roleApplicationKeys = {
  all: ['settings', 'role-applications'] as const,
  page: () => [...roleApplicationKeys.all, 'page'] as const,
  applications: () => [...roleApplicationKeys.all, 'applications'] as const,
  roleApps: (roleId: string) => [...roleApplicationKeys.all, 'role', roleId] as const,
}

export interface RoleApplicationsPageData {
  roles: RoleInfo[]
  applications: ApplicationItem[]
  roleApplicationIds: Record<string, string[]>
}

function fetchRoleApplicationsPage(): Promise<RoleApplicationsPageData> {
  return Promise.all([
    roleApplicationsService.getRoles(),
    roleApplicationsService.getAllApplications(),
  ]).then(async ([roles, applications]) => {
    const entries = await Promise.all(
      roles.map(async (r) => {
        const apps = await roleApplicationsService.getRoleApplications(r.id)
        return [r.id, apps.map((a) => a.id)] as const
      })
    )
    return {
      roles,
      applications,
      roleApplicationIds: Object.fromEntries(entries),
    }
  })
}

/**
 * Query: roles + applications + assignments for the role-applications page
 */
export function useRoleApplicationsPage() {
  return useQuery({
    queryKey: roleApplicationKeys.page(),
    queryFn: fetchRoleApplicationsPage,
  })
}

/**
 * Mutation: assign application to role
 */
export function useAssignRoleApplication() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ roleId, applicationId }: { roleId: string; applicationId: string }) =>
      roleApplicationsService.assignApplication(roleId, applicationId),
    onSuccess: (_, { roleId }) => {
      queryClient.invalidateQueries({ queryKey: roleApplicationKeys.page() })
      queryClient.invalidateQueries({ queryKey: roleApplicationKeys.roleApps(roleId) })
    },
  })
}

/**
 * Mutation: revoke application from role
 */
export function useRevokeRoleApplication() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ roleId, applicationId }: { roleId: string; applicationId: string }) =>
      roleApplicationsService.revokeApplication(roleId, applicationId),
    onSuccess: (_, { roleId }) => {
      queryClient.invalidateQueries({ queryKey: roleApplicationKeys.page() })
      queryClient.invalidateQueries({ queryKey: roleApplicationKeys.roleApps(roleId) })
    },
  })
}
