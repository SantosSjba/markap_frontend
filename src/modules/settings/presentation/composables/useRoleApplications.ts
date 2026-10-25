import type { RoleApplicationsRepository } from '../../domain/repositories/role-applications.repository'
import { roleApplicationsRepositoryKey } from '../../application/ports/role-applications.port'
import { useService } from '@shared/presentation/di/services'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { invalidateApplicationsQueries } from '@modules/applications/presentation/queries/invalidateApplicationsQueries'
import { invalidateQuerySubtree } from '@shared/utils/invalidateQuerySubtree'
import type { ApplicationItem, RoleInfo } from '../../domain/settings.types'
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

function fetchRoleApplicationsPage(
  roleApplicationsApiRepository: RoleApplicationsRepository,
): Promise<RoleApplicationsPageData> {
  return Promise.all([
    roleApplicationsApiRepository.getRoles(),
    roleApplicationsApiRepository.getAllApplications(),
  ]).then(async ([roles, applications]) => {
    const entries = await Promise.all(
      roles.map(async (r) => {
        const apps = await roleApplicationsApiRepository.getRoleApplications(r.id)
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
  const repository = useService(roleApplicationsRepositoryKey)
  return useQuery({
    queryKey: roleApplicationKeys.page(),
    queryFn: () => fetchRoleApplicationsPage(repository),
  })
}

export function useAssignRoleApplication() {
  const roleApplicationsApiRepository = useService(roleApplicationsRepositoryKey)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ roleId, applicationId }: { roleId: string; applicationId: string }) =>
      roleApplicationsApiRepository.assignApplication(roleId, applicationId),
    onSuccess: async () => {
      await Promise.all([
        invalidateQuerySubtree(queryClient, roleApplicationKeys.all),
        invalidateApplicationsQueries(queryClient, 'access'),
      ])
      void markapAlert.toast.success('Acceso concedido a la aplicación')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo conceder el acceso', getApiErrorMessage(err))
    },
  })
}

export function useRevokeRoleApplication() {
  const roleApplicationsApiRepository = useService(roleApplicationsRepositoryKey)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ roleId, applicationId }: { roleId: string; applicationId: string }) =>
      roleApplicationsApiRepository.revokeApplication(roleId, applicationId),
    onSuccess: async () => {
      await Promise.all([
        invalidateQuerySubtree(queryClient, roleApplicationKeys.all),
        invalidateApplicationsQueries(queryClient, 'access'),
      ])
      void markapAlert.toast.success('Acceso a la aplicación revocado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo revocar el acceso', getApiErrorMessage(err))
    },
  })
}
