import {apiClient} from '@shared/infrastructure/http/api-client'
import type {AuditLogsRepository,AuditLogItem} from '../../domain/repositories/audit-logs.repository'
export const auditLogsApiRepository:AuditLogsRepository={list:filters=>apiClient.get('/audit-logs',{params:filters}).then(r=>r.data),get:id=>apiClient.get<AuditLogItem>(`/audit-logs/${id}`).then(r=>r.data)}
