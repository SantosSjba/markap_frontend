import { createServiceKey } from '@shared/application/ports/service-key'
import type { InteriorDocumentsRepository } from '../../domain/repositories/documents.repository'
export const interiorDocumentsRepositoryKey = createServiceKey<InteriorDocumentsRepository>(
  'interiorismo.features.documentos.documents',
)
