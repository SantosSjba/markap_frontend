import { roleApplicationsRepositoryKey } from '../../application/ports/role-applications.port'
import { useService } from '@shared/presentation/di/services'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { invalidateApplicationsQueries } from '@modules/applications/presentation/queries/invalidateApplicationsQueries'
import { invalidateQuerySubtree } from '@shared/utils/invalidateQuerySubtree'
import type { AccessLevel } from '../../domain/settings.types'
export const roleApplicationKeys = {
  all: ['settings', 'role-applications'] as const,
  page: () => [...roleApplicationKeys.all, 'page'] as const,
  applications: () => [...roleApplicationKeys.all, 'applications'] as const,
  roleApps: (roleId: string) => [...roleApplicationKeys.all, 'role', roleId] as const,
}

export function useRoleApplicationsPage() {
  const repository = useService(roleApplicationsRepositoryKey)
  return useQuery({
    queryKey: roleApplicationKeys.page(),
    queryFn: () => repository.getMatrix(),
  })
}

/** Cambio de acceso de un rol a una app; `null` = sin acceso */
export interface RoleAccessChange {
  applicationId: string
  level: AccessLevel | null
}

/** Guarda en lote los cambios del modal de accesos de un rol */
export function useSaveRoleAccess() {
  const roleApplicationsApiRepository = useService(roleApplicationsRepositoryKey)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ roleId, changes }: { roleId: string; changes: RoleAccessChange[] }) => {
      const results = await Promise.allSettled(
        changes.map(({ applicationId, level }) =>
          level
            ? roleApplicationsApiRepository.setAccess(roleId, applicationId, level)
            : roleApplicationsApiRepository.revokeApplication(roleId, applicationId),
        ),
      )
      const failed = results.find((r): r is PromiseRejectedResult => r.status === 'rejected')
      if (failed) throw failed.reason
    },
    // Se invalida también si algo falló: parte de los cambios pudo haberse guardado
    onSettled: async () => {
      await Promise.all([
        invalidateQuerySubtree(queryClient, roleApplicationKeys.all),
        invalidateApplicationsQueries(queryClient, 'access'),
      ])
    },
    onSuccess: () => {
      void markapAlert.toast.success('Accesos actualizados')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudieron guardar todos los accesos', getApiErrorMessage(err))
    },
  })
}
