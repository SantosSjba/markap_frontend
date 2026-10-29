import { interiorDocumentsRepositoryKey as repoKey } from '../../application/ports/documents.port'
import { useService } from '@shared/presentation/di/services'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { invalidateModuleQueries } from '@shared/utils/invalidateModuleQueries'
import { INTERIORISMO_APP_SLUG } from '../../../../config/app.constants'
import type {
  CreateInteriorDocumentPayload,
  ListInteriorDocumentsParams,
  UpdateInteriorDocumentPayload,
  UploadInteriorDocumentPayload,
} from '../../domain/document.types'
export const interiorDocumentKeys = {
  all: ['interiorismo-documents', INTERIORISMO_APP_SLUG] as const,
  list: (p: ListInteriorDocumentsParams) => [...interiorDocumentKeys.all, 'list', p] as const,
  stats: (projectId?: string) => [...interiorDocumentKeys.all, 'stats', projectId ?? 'all'] as const,
}

export function useInteriorDocumentsList(params: Ref<ListInteriorDocumentsParams>) {
  const repo = useService(repoKey)
  return useQuery({
    queryKey: computed(() => interiorDocumentKeys.list(params.value)),
    queryFn: () => repo.list(params.value),
  })
}

/** Cantidad por tipo (pestañas), de todo el módulo o de un proyecto */
export function useInteriorDocumentStats(projectId: Ref<string | undefined>) {
  const repo = useService(repoKey)
  return useQuery({
    queryKey: computed(() => interiorDocumentKeys.stats(projectId.value)),
    queryFn: () => repo.stats(projectId.value),
  })
}

export function useCreateInteriorDocument() {
  const repo = useService(repoKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateInteriorDocumentPayload) => repo.create(payload),
    onSuccess: async () => {
      await invalidateModuleQueries(qc, 'interiorismo')
      void markapAlert.toast.success('Documento registrado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo registrar el documento', getApiErrorMessage(err))
    },
  })
}

export function useUploadInteriorDocument() {
  const repo = useService(repoKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UploadInteriorDocumentPayload) => repo.upload(payload),
    onSuccess: async () => {
      await invalidateModuleQueries(qc, 'interiorismo')
      void markapAlert.toast.success('Documento subido')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo subir el documento', getApiErrorMessage(err))
    },
  })
}

export function useUpdateInteriorDocument() {
  const repo = useService(repoKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateInteriorDocumentPayload }) =>
      repo.update(id, payload),
    onSuccess: async () => {
      await invalidateModuleQueries(qc, 'interiorismo')
      void markapAlert.toast.success('Documento actualizado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo actualizar', getApiErrorMessage(err))
    },
  })
}

export function useDeleteInteriorDocument() {
  const repo = useService(repoKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => repo.delete(id),
    onSuccess: async () => {
      await invalidateModuleQueries(qc, 'interiorismo')
      void markapAlert.toast.success('Documento eliminado')
    },
    onError: (err) => {
      void markapAlert.toast.error('No se pudo eliminar', getApiErrorMessage(err))
    },
  })
}

export function useOpenInteriorDocumentFile() {
  const repo = useService(repoKey)
  return async function openInteriorDocumentFile(row: {
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
}
