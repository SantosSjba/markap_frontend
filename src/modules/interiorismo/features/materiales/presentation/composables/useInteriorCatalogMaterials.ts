import { interiorCatalogMaterialsRepositoryKey as repoKey } from '../../application/ports/catalog-materials.port'
import { fetchAllPages } from '@shared/utils/fetchAllPages'
import { useService } from '@shared/presentation/di/services'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, unref, type Ref } from 'vue'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { invalidateModuleQueries } from '@shared/utils/invalidateModuleQueries'
import { INTERIORISMO_APP_SLUG } from '../../../../config/app.constants'
import type {
  CreateInteriorCatalogMaterialPayload,
  ListInteriorCatalogMaterialsParams,
  UpdateInteriorCatalogMaterialPayload,
} from '../../domain/catalog.types'
export const interiorCatalogMaterialsKeys = {
  all: ['interiorismo-catalog-materials', INTERIORISMO_APP_SLUG] as const,
  list: (p: ListInteriorCatalogMaterialsParams) =>
    [...interiorCatalogMaterialsKeys.all, 'list', p] as const,
  detail: (id: string) => [...interiorCatalogMaterialsKeys.all, 'detail', id] as const,
  stats: () => [...interiorCatalogMaterialsKeys.all, 'stats'] as const,
}

export function useInteriorCatalogMaterialsList(params: Ref<ListInteriorCatalogMaterialsParams>) {
  const repo = useService(repoKey)
  return useQuery({
    queryKey: computed(() => interiorCatalogMaterialsKeys.list(params.value)),
    queryFn: () => repo.getList(params.value),
  })
}

/** Indicadores del catálogo y categorías para el filtro */
export function useInteriorCatalogMaterialStats() {
  const repo = useService(repoKey)
  return useQuery({ queryKey: interiorCatalogMaterialsKeys.stats(), queryFn: () => repo.getStats() })
}

export function useInteriorCatalogMaterialDetail(id: Ref<string> | string) {
  const repo = useService(repoKey)
  return useQuery({
    queryKey: computed(() => interiorCatalogMaterialsKeys.detail(unref(id))),
    queryFn: () => repo.getById(unref(id)),
    enabled: computed(() => !!unref(id)),
  })
}

export function useCreateInteriorCatalogMaterial() {
  const repo = useService(repoKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateInteriorCatalogMaterialPayload) => repo.create(payload),
    onSuccess: async () => {
      await invalidateModuleQueries(qc, 'interiorismo')
      void markapAlert.toast.success('Material creado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo crear el material', getApiErrorMessage(err))
    },
  })
}

export function useUpdateInteriorCatalogMaterial(id: Ref<string> | string) {
  const repo = useService(repoKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateInteriorCatalogMaterialPayload) => repo.update(unref(id), payload),
    onSuccess: async () => {
      await invalidateModuleQueries(qc, 'interiorismo')
      void markapAlert.toast.success('Material guardado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo guardar', getApiErrorMessage(err))
    },
  })
}

export function useDeleteInteriorCatalogMaterial() {
  const repo = useService(repoKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (materialId: string) => repo.delete(materialId),
    onSuccess: async () => {
      await invalidateModuleQueries(qc, 'interiorismo')
      void markapAlert.toast.success('Material eliminado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo eliminar', getApiErrorMessage(err))
    },
  })
}

export function useUploadInteriorCatalogAsset() {
  const repo = useService(repoKey)
  return useMutation({
    mutationFn: ({
      file,
      kind,
      materialId,
    }: {
      file: File
      kind: 'technical-sheet' | 'image'
      materialId?: string
    }) => repo.uploadAsset(file, kind, materialId),
    onError: (err) => {
      void markapAlert.toast.error('No se pudo subir el archivo', getApiErrorMessage(err))
    },
  })
}

/** Opciones completas del catálogo; evita truncar la selección a la primera página. */
export function useInteriorCatalogMaterialsOptions(enabled: Ref<boolean>) {
  const repo = useService(repoKey)
  return useQuery({
    queryKey: [...interiorCatalogMaterialsKeys.all, 'options'],
    queryFn: () => fetchAllPages((page, limit) => repo.getList({ page, limit })),
    enabled,
  })
}
