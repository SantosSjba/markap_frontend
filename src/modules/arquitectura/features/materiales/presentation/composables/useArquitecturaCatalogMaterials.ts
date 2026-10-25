import { arquitecturaCatalogMaterialsRepositoryKey as repoKey } from '../../application/ports/catalog-materials.port'
import { useService } from '@shared/presentation/di/services'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, unref, type Ref } from 'vue'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { invalidateModuleQueries } from '@shared/utils/invalidateModuleQueries'
import { ARQUITECTURA_APP_SLUG } from '../../../../config/app.constants'
import type {
  CreateArquitecturaCatalogMaterialPayload,
  ListArquitecturaCatalogMaterialsParams,
  UpdateArquitecturaCatalogMaterialPayload,
} from '../../domain/catalog.types'
export const arquitecturaCatalogMaterialsKeys = {
  all: ['arquitectura-catalog-materials', ARQUITECTURA_APP_SLUG] as const,
  list: (p: ListArquitecturaCatalogMaterialsParams) =>
    [...arquitecturaCatalogMaterialsKeys.all, 'list', p] as const,
  detail: (id: string) => [...arquitecturaCatalogMaterialsKeys.all, 'detail', id] as const,
}

export function useArquitecturaCatalogMaterialsList(
  params: Ref<ListArquitecturaCatalogMaterialsParams>,
) {
  const repo = useService(repoKey)
  return useQuery({
    queryKey: computed(() => arquitecturaCatalogMaterialsKeys.list(params.value)),
    queryFn: () => repo.getList(params.value),
  })
}

export function useArquitecturaCatalogMaterialDetail(id: Ref<string> | string) {
  const repo = useService(repoKey)
  return useQuery({
    queryKey: computed(() => arquitecturaCatalogMaterialsKeys.detail(unref(id))),
    queryFn: () => repo.getById(unref(id)),
    enabled: computed(() => !!unref(id)),
  })
}

export function useCreateArquitecturaCatalogMaterial() {
  const repo = useService(repoKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateArquitecturaCatalogMaterialPayload) => repo.create(payload),
    onSuccess: async () => {
      await invalidateModuleQueries(qc, 'arquitectura')
      void markapAlert.toast.success('Material creado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo crear el material', getApiErrorMessage(err))
    },
  })
}

export function useUpdateArquitecturaCatalogMaterial(id: Ref<string> | string) {
  const repo = useService(repoKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateArquitecturaCatalogMaterialPayload) =>
      repo.update(unref(id), payload),
    onSuccess: async () => {
      await invalidateModuleQueries(qc, 'arquitectura')
      void markapAlert.toast.success('Material guardado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo guardar', getApiErrorMessage(err))
    },
  })
}

export function useDeleteArquitecturaCatalogMaterial() {
  const repo = useService(repoKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (materialId: string) => repo.delete(materialId),
    onSuccess: async () => {
      await invalidateModuleQueries(qc, 'arquitectura')
      void markapAlert.toast.success('Material eliminado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo eliminar', getApiErrorMessage(err))
    },
  })
}

export function useUploadArquitecturaCatalogAsset() {
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
