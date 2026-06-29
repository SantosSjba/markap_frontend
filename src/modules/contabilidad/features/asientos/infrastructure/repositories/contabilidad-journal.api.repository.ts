import { apiClient } from '@core/api/apiClient'
import { CONTABILIDAD_JOURNAL_APP_SLUG } from '../../domain/journal.types'
import type {
  ContabilidadJournalDetailResponse,
  ContabilidadJournalEntryDetailDTO,
  ContabilidadJournalListResponse,
  ListContabilidadJournalParams,
} from '../../domain/journal.types'
import type { ContabilidadJournalRepository } from '../../domain/repositories/contabilidad-journal.repository'

function qs(extra?: ListContabilidadJournalParams) {
  const u = new URLSearchParams()
  u.set('applicationSlug', CONTABILIDAD_JOURNAL_APP_SLUG)
  if (extra) {
    Object.entries(extra).forEach(([k, v]) => {
      if (v !== undefined && v !== '') u.set(k, String(v))
    })
  }
  return u.toString()
}

export const contabilidadJournalApiRepository: ContabilidadJournalRepository = {
  list: (params) =>
    apiClient
      .get<ContabilidadJournalListResponse>(`/contabilidad-journal-entries?${qs(params)}`)
      .then((r) => r.data),

  getById: (id) =>
    apiClient
      .get<ContabilidadJournalDetailResponse>(`/contabilidad-journal-entries/${id}?${qs()}`)
      .then((r) => r.data),

  create: (body) =>
    apiClient
      .post<ContabilidadJournalEntryDetailDTO>(`/contabilidad-journal-entries?${qs()}`, body)
      .then((r) => r.data),

  update: (id, body) =>
    apiClient
      .patch<ContabilidadJournalEntryDetailDTO>(`/contabilidad-journal-entries/${id}?${qs()}`, body)
      .then((r) => r.data),

  deleteDraft: (id) =>
    apiClient
      .delete(`/contabilidad-journal-entries/${id}?${qs()}`)
      .then(() => undefined),

  post: (id) =>
    apiClient
      .post<ContabilidadJournalEntryDetailDTO>(`/contabilidad-journal-entries/${id}/post?${qs()}`)
      .then((r) => r.data),

  reverse: (id) =>
    apiClient
      .post<ContabilidadJournalEntryDetailDTO>(`/contabilidad-journal-entries/${id}/reverse?${qs()}`)
      .then((r) => r.data),
}
