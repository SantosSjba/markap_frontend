import { apiClient } from '@core/api/apiClient'
import { INTERIORISMO_APP_SLUG } from '@modules/interiorismo/config/app.constants'
import type {
  CreateInteriorDocumentPayload,
  InteriorDocumentRow,
  ListInteriorDocumentsParams,
  ListInteriorDocumentsResponse,
  UpdateInteriorDocumentPayload,
  UploadInteriorDocumentPayload,
} from '../domain/document.types'
import type { InteriorDocumentsRepository } from '../domain/repositories/documents.repository'

const BASE = '/interiorismo-documents'

function queryParams(params: ListInteriorDocumentsParams) {
  const searchParams = new URLSearchParams()
  searchParams.set('applicationSlug', INTERIORISMO_APP_SLUG)
  searchParams.set('docType', params.docType)
  searchParams.set('page', String(params.page ?? 1))
  searchParams.set('limit', String(params.limit ?? 10))
  if (params.search) searchParams.set('search', params.search)
  if (params.projectId) searchParams.set('projectId', params.projectId)
  return searchParams.toString()
}

export const interiorDocumentsApiRepository: InteriorDocumentsRepository = {
  list: (params: ListInteriorDocumentsParams) =>
    apiClient.get<ListInteriorDocumentsResponse>(`${BASE}?${queryParams(params)}`).then((r) => r.data),

  create: (payload: CreateInteriorDocumentPayload) =>
    apiClient
      .post<InteriorDocumentRow>(BASE, payload, {
        params: { applicationSlug: INTERIORISMO_APP_SLUG },
      })
      .then((r) => r.data),

  upload: (payload: UploadInteriorDocumentPayload) => {
    const fd = new FormData()
    fd.append('file', payload.file)
    fd.append('projectId', payload.projectId)
    fd.append('docType', payload.docType)
    fd.append('title', payload.title)
    return apiClient
      .post<InteriorDocumentRow>(`${BASE}/upload`, fd, {
        params: { applicationSlug: INTERIORISMO_APP_SLUG },
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },

  update: (id: string, payload: UpdateInteriorDocumentPayload) =>
    apiClient
      .patch<InteriorDocumentRow>(`${BASE}/${id}`, payload, {
        params: { applicationSlug: INTERIORISMO_APP_SLUG },
      })
      .then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`${BASE}/${id}`, {
      params: { applicationSlug: INTERIORISMO_APP_SLUG },
    }),

  getDownloadUrl: (archivoId: string) =>
    apiClient
      .get<{ url: string }>(`/gen-archivos/${archivoId}/url`, {
        params: { applicationSlug: INTERIORISMO_APP_SLUG },
      })
      .then((r) => r.data.url),
}
