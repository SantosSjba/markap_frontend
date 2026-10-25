import { createServiceKey } from '@shared/application/ports/service-key'
import type { ContabilidadJournalTemplatesRepository } from '../../domain/repositories/contabilidad-journal-templates.repository'
export const contabilidadJournalTemplatesRepositoryKey =
  createServiceKey<ContabilidadJournalTemplatesRepository>(
    'contabilidad.features.plantillas-asiento.contabilidad-journal-templates',
  )
