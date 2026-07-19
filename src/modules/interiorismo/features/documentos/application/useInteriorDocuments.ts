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
  UploadInteriorDocumentPayload,
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

export function useUploadInteriorDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UploadInteriorDocumentPayload) => repo.upload(payload),
    onSuccess: () => {
      invalidateQuerySubtree(qc, interiorDocumentKeys.all)
      void markapAlert.toast.success('Documento subido')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo subir el documento', getApiErrorMessage(err))
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

export async function openInteriorDocumentFile(row: {
  archivoId: string | null
  downloadUrl?: string | null
  fileUrl: string | null
}) {
  try {
    if (row.archivoId) {
      const url = await repo.getDownloadUrl(row.archivoId)
      window.open(url, '_blank', 'noopener,noreferrer')
      return
    }
    const url = row.downloadUrl || row.fileUrl
    if (url && /^https?:\/\//i.test(url)) {
      window.open(url, '_blank', 'noopener,noreferrer')
      return
    }
    void markapAlert.toast.error('No hay archivo disponible')
  } catch {
    void markapAlert.toast.error('No se pudo abrir el archivo')
  }
}
