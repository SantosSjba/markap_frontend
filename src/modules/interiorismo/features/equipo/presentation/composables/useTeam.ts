import { interiorTeamRepositoryKey } from '../../application/ports/team.port'
import { useService } from '@shared/presentation/di/services'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, unref, type Ref } from 'vue'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { fetchAllPages } from '@shared/utils/fetchAllPages'
import { invalidateQuerySubtree } from '@shared/utils/invalidateQuerySubtree'
import { INTERIORISMO_APP_SLUG } from '../../../../config/app.constants'
import type {
  ListTeamParams,
  TeamMemberFormPayload,
  UpdateTeamMemberPayload,
} from '../../domain/team.types'

/** Raíz compartida con los demás selectores de agentes de Interiorismo (calendario, proyectos). */
export const interiorTeamKeys = {
  root: ['agents', INTERIORISMO_APP_SLUG] as const,
  list: (params: ListTeamParams) => [...interiorTeamKeys.root, 'team', 'list', params] as const,
  active: () => [...interiorTeamKeys.root, 'team', 'active'] as const,
  detail: (id: string) => [...interiorTeamKeys.root, 'team', 'detail', id] as const,
}

export function useInteriorTeamList(params: Ref<ListTeamParams>) {
  const repository = useService(interiorTeamRepositoryKey)
  return useQuery({
    queryKey: computed(() => interiorTeamKeys.list(unref(params))),
    queryFn: () => repository.list(unref(params)),
  })
}

/** Todos los integrantes activos (para los selectores de responsables del proyecto). */
export function useInteriorActiveTeam() {
  const repository = useService(interiorTeamRepositoryKey)
  return useQuery({
    queryKey: interiorTeamKeys.active(),
    queryFn: () => fetchAllPages((page, limit) => repository.list({ page, limit, isActive: true })),
  })
}

export function useInteriorTeamMember(id: Ref<string>) {
  const repository = useService(interiorTeamRepositoryKey)
  return useQuery({
    queryKey: computed(() => interiorTeamKeys.detail(unref(id))),
    queryFn: () => repository.getById(unref(id)),
    enabled: computed(() => !!unref(id)),
  })
}

export function useCreateInteriorTeamMember() {
  const repository = useService(interiorTeamRepositoryKey)
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: TeamMemberFormPayload) => repository.create(payload),
    onSuccess: () => {
      invalidateQuerySubtree(queryClient, interiorTeamKeys.root)
      void markapAlert.toast.success('Integrante registrado', 'Ya puede asignarse como responsable de proyectos.')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo registrar el integrante', getApiErrorMessage(err))
    },
  })
}

export function useUpdateInteriorTeamMember() {
  const repository = useService(interiorTeamRepositoryKey)
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTeamMemberPayload }) => repository.update(id, data),
    onSuccess: (_, { data }) => {
      invalidateQuerySubtree(queryClient, interiorTeamKeys.root)
      const onlyStatus = Object.keys(data).length === 1 && data.isActive !== undefined
      if (onlyStatus && data.isActive === false) {
        void markapAlert.toast.success('Integrante desactivado', 'Ya no se ofrecerá al asignar responsables.')
      } else if (onlyStatus) {
        void markapAlert.toast.success('Integrante reactivado', 'Vuelve a estar disponible en los proyectos.')
      } else {
        void markapAlert.toast.success('Cambios guardados', 'Los datos del integrante se actualizaron.')
      }
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudieron guardar los cambios', getApiErrorMessage(err))
    },
  })
}

export function useDeleteInteriorTeamMember() {
  const repository = useService(interiorTeamRepositoryKey)
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => repository.delete(id),
    onSuccess: () => {
      invalidateQuerySubtree(queryClient, interiorTeamKeys.root)
      void markapAlert.toast.success(
        'Integrante eliminado',
        'Deja de mostrarse en el equipo; los proyectos donde figura lo conservan.',
      )
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo eliminar el integrante', getApiErrorMessage(err))
    },
  })
}
