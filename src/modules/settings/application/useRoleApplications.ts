import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { roleApplicationsService } from '../infrastructure/role-applications.service'
import { markapAlert } from '@/shared/alert'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import { invalidateQuerySubtree } from '@/shared/utils/invalidateQuerySubtree'
import type { ApplicationItem, RoleInfo } from '../domain/settings.types'

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
      }),
    )
    return {
      roles,
      applications,
      roleApplicationIds: Object.fromEntries(entries),
    }
  })
}

export function useRoleApplicationsPage() {
  return useQuery({
    queryKey: roleApplicationKeys.page(),
    queryFn: fetchRoleApplicationsPage,
  })
}

export function useAssignRoleApplication() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ roleId, applicationId }: { roleId: string; applicationId: string }) =>
      roleApplicationsService.assignApplication(roleId, applicationId),
    onSuccess: () => {
      invalidateQuerySubtree(queryClient, roleApplicationKeys.all)
      void markapAlert.toast.success('Acceso concedido a la aplicación')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo conceder el acceso', getApiErrorMessage(err))
    },
  })
}

export function useRevokeRoleApplication() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ roleId, applicationId }: { roleId: string; applicationId: string }) =>
      roleApplicationsService.revokeApplication(roleId, applicationId),
    onSuccess: () => {
      invalidateQuerySubtree(queryClient, roleApplicationKeys.all)
      void markapAlert.toast.success('Acceso a la aplicación revocado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo revocar el acceso', getApiErrorMessage(err))
    },
  })
}
