import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, unref, type Ref } from 'vue'
import { markapAlert } from '@/shared/composables'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import { invalidateQuerySubtree } from '@/shared/utils/invalidateQuerySubtree'
import type {
  CreateInteriorProjectPayload,
  ListInteriorProjectsParams,
  UpdateInteriorProjectPayload,
} from '../domain/project.types'
import { INTERIORISMO_APP_SLUG } from '@modules/interiorismo/config/app.constants'
import { interiorProjectsApiRepository as repo } from '../infrastructure/projects.api.repository'

export const interiorProjectKeys = {
  all: ['interiorismo-projects', INTERIORISMO_APP_SLUG] as const,
  list: (p: ListInteriorProjectsParams) => [...interiorProjectKeys.all, 'list', p] as const,
  detail: (id: string) => [...interiorProjectKeys.all, 'detail', id] as const,
}

export function useInteriorProjectsList(params: Ref<ListInteriorProjectsParams>) {
  return useQuery({
    queryKey: computed(() => interiorProjectKeys.list(params.value)),
    queryFn: () => repo.getList(params.value),
  })
}

export function useInteriorProjectDetail(id: Ref<string> | string) {
  return useQuery({
    queryKey: computed(() => interiorProjectKeys.detail(unref(id))),
    queryFn: () => repo.getById(unref(id)),
    enabled: computed(() => !!unref(id)),
  })
}

export function useCreateInteriorProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateInteriorProjectPayload) => repo.create(payload),
    onSuccess: () => {
      invalidateQuerySubtree(qc, interiorProjectKeys.all)
      void markapAlert.toast.success('Proyecto creado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo crear el proyecto', getApiErrorMessage(err))
    },
  })
}

export function useUpdateInteriorProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: { id: string; payload: UpdateInteriorProjectPayload }) =>
      repo.update(args.id, args.payload),
    onSuccess: (_data, vars) => {
      invalidateQuerySubtree(qc, interiorProjectKeys.all)
      void markapAlert.toast.success(
        vars.payload.status === 'CANCELLED' ? 'Proyecto cancelado' : 'Proyecto actualizado',
      )
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo actualizar el proyecto', getApiErrorMessage(err))
    },
  })
}
