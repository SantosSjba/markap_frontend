import { createServiceKey } from '@shared/application/ports/service-key'
import type { AuditRepository } from '../../domain/repositories/audit.repository'
export const auditRepositoryKey = createServiceKey<AuditRepository>(
  'contabilidad.features.auditoria.audit',
)
