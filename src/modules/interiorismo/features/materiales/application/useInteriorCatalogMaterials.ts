import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, unref, type Ref } from 'vue'
import { markapAlert } from '@/shared/composables'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import { invalidateQuerySubtree } from '@/shared/utils/invalidateQuerySubtree'
import { INTERIORISMO_APP_SLUG } from '@modules/interiorismo/config/app.constants'
import type {
  CreateInteriorCatalogMaterialPayload,
  ListInteriorCatalogMaterialsParams,
  UpdateInteriorCatalogMaterialPayload,
} from '../domain/catalog.types'
import { interiorCatalogMaterialsApiRepository as repo } from '../infrastructure/catalogMaterials.api.repository'

export const interiorCatalogMaterialsKeys = {
  all: ['interiorismo-catalog-materials', INTERIORISMO_APP_SLUG] as const,
  list: (p: ListInteriorCatalogMaterialsParams) =>
    [...interiorCatalogMaterialsKeys.all, 'list', p] as const,
  detail: (id: string) => [...interiorCatalogMaterialsKeys.all, 'detail', id] as const,
}

export function useInteriorCatalogMaterialsList(params: Ref<ListInteriorCatalogMaterialsParams>) {
  return useQuery({
    queryKey: computed(() => interiorCatalogMaterialsKeys.list(params.value)),
    queryFn: () => repo.getList(params.value),
  })
}

export function useInteriorCatalogMaterialDetail(id: Ref<string> | string) {
  return useQuery({
    queryKey: computed(() => interiorCatalogMaterialsKeys.detail(unref(id))),
    queryFn: () => repo.getById(unref(id)),
    enabled: computed(() => !!unref(id)),
  })
}

export function useCreateInteriorCatalogMaterial() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateInteriorCatalogMaterialPayload) => repo.create(payload),
    onSuccess: () => {
      invalidateQuerySubtree(qc, interiorCatalogMaterialsKeys.all)
      void markapAlert.toast.success('Material creado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo crear el material', getApiErrorMessage(err))
    },
  })
}

export function useUpdateInteriorCatalogMaterial(id: Ref<string> | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateInteriorCatalogMaterialPayload) =>
      repo.update(unref(id), payload),
    onSuccess: () => {
      invalidateQuerySubtree(qc, interiorCatalogMaterialsKeys.all)
      void markapAlert.toast.success('Material guardado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo guardar', getApiErrorMessage(err))
    },
  })
}

export function useDeleteInteriorCatalogMaterial() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (materialId: string) => repo.delete(materialId),
    onSuccess: () => {
      invalidateQuerySubtree(qc, interiorCatalogMaterialsKeys.all)
      void markapAlert.toast.success('Material eliminado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo eliminar', getApiErrorMessage(err))
    },
  })
}

export function useUploadInteriorCatalogAsset() {
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
