import { createServiceKey } from '@shared/application/ports/service-key'
import type { ArquitecturaDocumentsRepository } from '../../domain/repositories/documents.repository'
export const arquitecturaDocumentsRepositoryKey = createServiceKey<ArquitecturaDocumentsRepository>(
  'arquitectura.features.documentos.documents',
)
