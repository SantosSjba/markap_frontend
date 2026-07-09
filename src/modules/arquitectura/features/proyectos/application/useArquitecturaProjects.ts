import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, unref, type Ref } from 'vue'
import { markapAlert } from '@/shared/composables'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import { invalidateQuerySubtree } from '@/shared/utils/invalidateQuerySubtree'
import type {
  CreateArquitecturaProjectPayload,
  ListArquitecturaProjectsParams,
  UpdateArquitecturaProjectPayload,
} from '../domain/project.types'
import { ARQUITECTURA_APP_SLUG } from '@modules/arquitectura/config/app.constants'
import { arquitecturaProjectsApiRepository as repo } from '../infrastructure/projects.api.repository'

export const arquitecturaProjectKeys = {
  all: ['arquitectura-projects', ARQUITECTURA_APP_SLUG] as const,
  list: (p: ListArquitecturaProjectsParams) => [...arquitecturaProjectKeys.all, 'list', p] as const,
  detail: (id: string) => [...arquitecturaProjectKeys.all, 'detail', id] as const,
}

export function useArquitecturaProjectsList(params: Ref<ListArquitecturaProjectsParams>) {
  return useQuery({
    queryKey: computed(() => arquitecturaProjectKeys.list(params.value)),
    queryFn: () => repo.getList(params.value),
  })
}

export function useArquitecturaProjectDetail(id: Ref<string> | string) {
  return useQuery({
    queryKey: computed(() => arquitecturaProjectKeys.detail(unref(id))),
    queryFn: () => repo.getById(unref(id)),
    enabled: computed(() => !!unref(id)),
  })
}

export function useCreateArquitecturaProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateArquitecturaProjectPayload) => repo.create(payload),
    onSuccess: () => {
      invalidateQuerySubtree(qc, arquitecturaProjectKeys.all)
      void markapAlert.toast.success('Proyecto creado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo crear el proyecto', getApiErrorMessage(err))
    },
  })
}

export function useUpdateArquitecturaProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: { id: string; payload: UpdateArquitecturaProjectPayload }) =>
      repo.update(args.id, args.payload),
    onSuccess: (_data, vars) => {
      invalidateQuerySubtree(qc, arquitecturaProjectKeys.all)
      void markapAlert.toast.success(
        vars.payload.status === 'CANCELLED' ? 'Proyecto cancelado' : 'Proyecto actualizado',
      )
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo actualizar el proyecto', getApiErrorMessage(err))
    },
  })
}
