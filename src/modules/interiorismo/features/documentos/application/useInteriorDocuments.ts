import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { markapAlert } from '@/shared/composables'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import { invalidateQuerySubtree } from '@/shared/utils/invalidateQuerySubtree'
import { INTERIORISMO_APP_SLUG } from '@modules/interiorismo/config/app.constants'
import type {
  CreateInteriorDocumentPayload,
  ListInteriorDocumentsParams,
  UpdateInteriorDocumentPayload,
} from '../domain/document.types'
import { interiorDocumentsApiRepository as repo } from '../infrastructure/documents.api.repository'

export const interiorDocumentKeys = {
  all: ['interiorismo-documents', INTERIORISMO_APP_SLUG] as const,
  list: (p: ListInteriorDocumentsParams) => [...interiorDocumentKeys.all, 'list', p] as const,
}

export function useInteriorDocumentsList(params: Ref<ListInteriorDocumentsParams>) {
  return useQuery({
    queryKey: computed(() => interiorDocumentKeys.list(params.value)),
    queryFn: () => repo.list(params.value),
  })
}

export function useCreateInteriorDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateInteriorDocumentPayload) => repo.create(payload),
    onSuccess: () => {
      invalidateQuerySubtree(qc, interiorDocumentKeys.all)
      void markapAlert.toast.success('Documento registrado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo registrar el documento', getApiErrorMessage(err))
    },
  })
}

export function useUpdateInteriorDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateInteriorDocumentPayload }) =>
      repo.update(id, payload),
    onSuccess: () => {
      invalidateQuerySubtree(qc, interiorDocumentKeys.all)
      void markapAlert.toast.success('Documento actualizado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo actualizar', getApiErrorMessage(err))
    },
  })
}

export function useDeleteInteriorDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => repo.delete(id),
    onSuccess: () => {
      invalidateQuerySubtree(qc, interiorDocumentKeys.all)
      void markapAlert.toast.success('Documento eliminado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo eliminar', getApiErrorMessage(err))
    },
  })
}
