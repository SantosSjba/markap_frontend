import {createServiceKey} from '@shared/application/ports/service-key'
import type {AuditLogsRepository} from '../../domain/repositories/audit-logs.repository'
export const auditLogsRepositoryKey = createServiceKey<AuditLogsRepository>('settings.audit-logs')
