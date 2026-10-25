import { createServiceKey } from '@shared/application/ports/service-key'
import type { ContabilidadJournalRepository } from '../../domain/repositories/contabilidad-journal.repository'
export const contabilidadJournalRepositoryKey = createServiceKey<ContabilidadJournalRepository>(
  'contabilidad.features.asientos.contabilidad-journal',
)
