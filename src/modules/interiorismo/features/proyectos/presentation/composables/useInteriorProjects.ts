import { interiorProjectsRepositoryKey as repoKey } from '../../application/ports/projects.port'
import { useService } from '@shared/presentation/di/services'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, unref, type Ref } from 'vue'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { invalidateModuleQueries } from '@shared/utils/invalidateModuleQueries'
import { fetchAllPages } from '@shared/utils/fetchAllPages'
import type {
  CreateInteriorProjectActivityPayload,
  CreateInteriorProjectPayload,
  ListInteriorProjectsParams,
  UpdateInteriorProjectPayload,
} from '../../domain/project.types'
import { INTERIORISMO_APP_SLUG } from '../../../../config/app.constants'
export const interiorProjectKeys = {
  all: ['interiorismo-projects', INTERIORISMO_APP_SLUG] as const,
  list: (p: ListInteriorProjectsParams) => [...interiorProjectKeys.all, 'list', p] as const,
  detail: (id: string) => [...interiorProjectKeys.all, 'detail', id] as const,
  stats: () => [...interiorProjectKeys.all, 'stats'] as const,
  clientsSummary: (ids: string[]) => [...interiorProjectKeys.all, 'clients-summary', ids] as const,
  clientPayments: (clientId: string) => [...interiorProjectKeys.all, 'client-payments', clientId] as const,
}

export function useInteriorProjectsList(params: Ref<ListInteriorProjectsParams>) {
  const repo = useService(repoKey)
  return useQuery({
    queryKey: computed(() => interiorProjectKeys.list(params.value)),
    queryFn: () => repo.getList(params.value),
  })
}

/**
 * Opciones de proyecto para filtros y selectores (`código · nombre`). El listado del backend
 * topa en 50 por página, así que se traen todas las páginas.
 */
export function useInteriorProjectOptions() {
  const repo = useService(repoKey)
  const query = useQuery({
    queryKey: [...interiorProjectKeys.all, 'options'] as const,
    queryFn: () => fetchAllPages((page, limit) => repo.getList({ page, limit })),
  })
  const options = computed(() => (query.data.value ?? []).map((p) => ({ value: p.id, label: `${p.code} · ${p.name}` })))
  return { ...query, options }
}

/** Indicadores del listado: conteo por etapa, nuevos del mes y cartera activa por moneda */
export function useInteriorProjectStats() {
  const repo = useService(repoKey)
  return useQuery({
    queryKey: interiorProjectKeys.stats(),
    queryFn: () => repo.getStats(),
  })
}

/** Proyectos (total y activos) de los clientes visibles en el listado */
export function useInteriorClientsProjectsSummary(clientIds: Ref<string[]>) {
  const repo = useService(repoKey)
  return useQuery({
    queryKey: computed(() => interiorProjectKeys.clientsSummary(clientIds.value)),
    queryFn: () => repo.getClientsSummary(clientIds.value),
    enabled: computed(() => clientIds.value.length > 0),
  })
}

/** Cobros del cliente en todos sus proyectos */
export function useInteriorClientPayments(clientId: Ref<string>) {
  const repo = useService(repoKey)
  return useQuery({
    queryKey: computed(() => interiorProjectKeys.clientPayments(clientId.value)),
    queryFn: () => repo.getClientPayments(clientId.value),
    enabled: computed(() => !!clientId.value),
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

/** Actividad del proyecto: el servidor responde la ficha actualizada y reemplaza la caché del detalle. */
export function useCreateInteriorProjectActivity(projectId: Ref<string> | string) {
  const repo = useService(repoKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateInteriorProjectActivityPayload) => repo.createActivity(unref(projectId), payload),
    onSuccess: (detail) => {
      qc.setQueryData(interiorProjectKeys.detail(unref(projectId)), detail)
      void markapAlert.toast.success('Actividad registrada')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo registrar la actividad', getApiErrorMessage(err))
    },
  })
}

export function useDeleteInteriorProjectActivity(projectId: Ref<string> | string) {
  const repo = useService(repoKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (activityId: string) => repo.deleteActivity(unref(projectId), activityId),
    onSuccess: (detail) => {
      qc.setQueryData(interiorProjectKeys.detail(unref(projectId)), detail)
      void markapAlert.toast.success('Actividad eliminada')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo eliminar la actividad', getApiErrorMessage(err))
    },
  })
}
