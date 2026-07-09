import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, unref, type Ref } from 'vue'
import { markapAlert } from '@/shared/composables'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import { invalidateQuerySubtree } from '@/shared/utils/invalidateQuerySubtree'
import { ARQUITECTURA_APP_SLUG } from '@modules/arquitectura/config/app.constants'
import type {
  CreateArquitecturaCatalogMaterialPayload,
  ListArquitecturaCatalogMaterialsParams,
  UpdateArquitecturaCatalogMaterialPayload,
} from '../domain/catalog.types'
import { interiorCatalogMaterialsApiRepository as repo } from '../infrastructure/catalogMaterials.api.repository'

export const interiorCatalogMaterialsKeys = {
  all: ['arquitectura-catalog-materials', ARQUITECTURA_APP_SLUG] as const,
  list: (p: ListArquitecturaCatalogMaterialsParams) =>
    [...interiorCatalogMaterialsKeys.all, 'list', p] as const,
  detail: (id: string) => [...interiorCatalogMaterialsKeys.all, 'detail', id] as const,
}

export function useArquitecturaCatalogMaterialsList(params: Ref<ListArquitecturaCatalogMaterialsParams>) {
  return useQuery({
    queryKey: computed(() => interiorCatalogMaterialsKeys.list(params.value)),
    queryFn: () => repo.getList(params.value),
  })
}

export function useArquitecturaCatalogMaterialDetail(id: Ref<string> | string) {
  return useQuery({
    queryKey: computed(() => interiorCatalogMaterialsKeys.detail(unref(id))),
    queryFn: () => repo.getById(unref(id)),
    enabled: computed(() => !!unref(id)),
  })
}

export function useCreateArquitecturaCatalogMaterial() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateArquitecturaCatalogMaterialPayload) => repo.create(payload),
    onSuccess: () => {
      invalidateQuerySubtree(qc, interiorCatalogMaterialsKeys.all)
      void markapAlert.toast.success('Material creado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo crear el material', getApiErrorMessage(err))
    },
  })
}

export function useUpdateArquitecturaCatalogMaterial(id: Ref<string> | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateArquitecturaCatalogMaterialPayload) =>
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

export function useDeleteArquitecturaCatalogMaterial() {
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
