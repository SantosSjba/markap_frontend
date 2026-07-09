import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { markapAlert } from '@/shared/composables'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import { invalidateQuerySubtree } from '@/shared/utils/invalidateQuerySubtree'
import { ARQUITECTURA_APP_SLUG } from '@modules/arquitectura/config/app.constants'
import type {
  CreateArquitecturaDocumentPayload,
  ListArquitecturaDocumentsParams,
  UpdateArquitecturaDocumentPayload,
} from '../domain/document.types'
import { arquitecturaDocumentsApiRepository as repo } from '../infrastructure/documents.api.repository'

export const arquitecturaDocumentKeys = {
  all: ['arquitectura-documents', ARQUITECTURA_APP_SLUG] as const,
  list: (p: ListArquitecturaDocumentsParams) => [...arquitecturaDocumentKeys.all, 'list', p] as const,
}

export function useArquitecturaDocumentsList(params: Ref<ListArquitecturaDocumentsParams>) {
  return useQuery({
    queryKey: computed(() => arquitecturaDocumentKeys.list(params.value)),
    queryFn: () => repo.list(params.value),
  })
}

export function useCreateArquitecturaDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateArquitecturaDocumentPayload) => repo.create(payload),
    onSuccess: () => {
      invalidateQuerySubtree(qc, arquitecturaDocumentKeys.all)
      void markapAlert.toast.success('Documento registrado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo registrar el documento', getApiErrorMessage(err))
    },
  })
}

export function useUpdateArquitecturaDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateArquitecturaDocumentPayload }) =>
      repo.update(id, payload),
    onSuccess: () => {
      invalidateQuerySubtree(qc, arquitecturaDocumentKeys.all)
      void markapAlert.toast.success('Documento actualizado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo actualizar', getApiErrorMessage(err))
    },
  })
}

export function useDeleteArquitecturaDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => repo.delete(id),
    onSuccess: () => {
      invalidateQuerySubtree(qc, arquitecturaDocumentKeys.all)
      void markapAlert.toast.success('Documento eliminado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo eliminar', getApiErrorMessage(err))
    },
  })
}
