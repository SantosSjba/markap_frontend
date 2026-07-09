import { apiClient } from '@core/api/apiClient'
import { ARQUITECTURA_APP_SLUG } from '@modules/arquitectura/config/app.constants'
import type {
  CreateArquitecturaDocumentPayload,
  ArquitecturaDocumentRow,
  ListArquitecturaDocumentsParams,
  ListArquitecturaDocumentsResponse,
  UpdateArquitecturaDocumentPayload,
} from '../domain/document.types'
import type { ArquitecturaDocumentsRepository } from '../domain/repositories/documents.repository'

const BASE = '/arquitectura-documents'

function queryParams(params: ListArquitecturaDocumentsParams) {
  const searchParams = new URLSearchParams()
  searchParams.set('applicationSlug', ARQUITECTURA_APP_SLUG)
  searchParams.set('docType', params.docType)
  searchParams.set('page', String(params.page ?? 1))
  searchParams.set('limit', String(params.limit ?? 10))
  if (params.search) searchParams.set('search', params.search)
  if (params.projectId) searchParams.set('projectId', params.projectId)
  return searchParams.toString()
}

export const arquitecturaDocumentsApiRepository: ArquitecturaDocumentsRepository = {
  list: (params: ListArquitecturaDocumentsParams) =>
    apiClient.get<ListArquitecturaDocumentsResponse>(`${BASE}?${queryParams(params)}`).then((r) => r.data),

  create: (payload: CreateArquitecturaDocumentPayload) =>
    apiClient
      .post<ArquitecturaDocumentRow>(BASE, payload, {
        params: { applicationSlug: ARQUITECTURA_APP_SLUG },
      })
      .then((r) => r.data),

  update: (id: string, payload: UpdateArquitecturaDocumentPayload) =>
    apiClient
      .patch<ArquitecturaDocumentRow>(`${BASE}/${id}`, payload, {
        params: { applicationSlug: ARQUITECTURA_APP_SLUG },
      })
      .then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`${BASE}/${id}`, {
      params: { applicationSlug: ARQUITECTURA_APP_SLUG },
    }),
}
