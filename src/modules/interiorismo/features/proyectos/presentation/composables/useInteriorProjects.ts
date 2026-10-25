import { interiorProjectsRepositoryKey as repoKey } from '../../application/ports/projects.port'
import { useService } from '@shared/presentation/di/services'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, unref, type Ref } from 'vue'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { invalidateModuleQueries } from '@shared/utils/invalidateModuleQueries'
import type {
  CreateInteriorProjectPayload,
  ListInteriorProjectsParams,
  UpdateInteriorProjectPayload,
} from '../../domain/project.types'
import { INTERIORISMO_APP_SLUG } from '../../../../config/app.constants'
export const interiorProjectKeys = {
  all: ['interiorismo-projects', INTERIORISMO_APP_SLUG] as const,
  list: (p: ListInteriorProjectsParams) => [...interiorProjectKeys.all, 'list', p] as const,
  detail: (id: string) => [...interiorProjectKeys.all, 'detail', id] as const,
}

export function useInteriorProjectsList(params: Ref<ListInteriorProjectsParams>) {
  const repo = useService(repoKey)
  return useQuery({
    queryKey: computed(() => interiorProjectKeys.list(params.value)),
    queryFn: () => repo.getList(params.value),
  })
}

export function useInteriorProjectDetail(id: Ref<string> | string) {
  const repo = useService(repoKey)
  return useQuery({
    queryKey: computed(() => interiorProjectKeys.detail(unref(id))),
    queryFn: () => repo.getById(unref(id)),
    enabled: computed(() => !!unref(id)),
  })
}

export function useCreateInteriorProject() {
  const repo = useService(repoKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateInteriorProjectPayload) => repo.create(payload),
    onSuccess: async () => {
      await invalidateModuleQueries(qc, 'interiorismo')
      void markapAlert.toast.success('Proyecto creado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo crear el proyecto', getApiErrorMessage(err))
    },
  })
}

export function useUpdateInteriorProject() {
  const repo = useService(repoKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: { id: string; payload: UpdateInteriorProjectPayload }) =>
      repo.update(args.id, args.payload),
    onSuccess: async (_data, vars) => {
      await invalidateModuleQueries(qc, 'interiorismo')
      void markapAlert.toast.success(
        vars.payload.status === 'CANCELLED' ? 'Proyecto cancelado' : 'Proyecto actualizado',
      )
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo actualizar el proyecto', getApiErrorMessage(err))
    },
  })
}
