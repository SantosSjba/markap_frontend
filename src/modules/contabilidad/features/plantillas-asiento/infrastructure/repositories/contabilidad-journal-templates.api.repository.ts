import { apiClient } from '@core/api/apiClient'
import { CONTABILIDAD_JOURNAL_TEMPLATES_APP_SLUG } from '../../domain/journal-template.types'
import type { ContabilidadJournalTemplatesRepository } from '../../domain/repositories/contabilidad-journal-templates.repository'

function qs() {
  return `applicationSlug=${CONTABILIDAD_JOURNAL_TEMPLATES_APP_SLUG}`
}

export const contabilidadJournalTemplatesApiRepository: ContabilidadJournalTemplatesRepository = {
  listTemplates: () =>
    apiClient.get(`/contabilidad-extensions/journal-templates?${qs()}`).then((r) => r.data),

  createTemplate: (body) =>
    apiClient.post(`/contabilidad-extensions/journal-templates?${qs()}`, body).then((r) => r.data),

  updateTemplate: (id, body) =>
    apiClient.patch(`/contabilidad-extensions/journal-templates/${id}?${qs()}`, body).then((r) => r.data),

  applyTemplate: (id) =>
    apiClient.post(`/contabilidad-extensions/journal-templates/${id}/apply?${qs()}`).then((r) => r.data),
}
