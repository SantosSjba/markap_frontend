import {useQuery} from '@tanstack/vue-query'
import {useService} from '@shared/presentation/di/services'
import {auditLogsRepositoryKey} from '../../application/ports/audit-logs.port'
import type {AuditFilters} from '../../domain/repositories/audit-logs.repository'
import {toValue,type MaybeRefOrGetter} from 'vue'
export function useAuditLogs(filters:MaybeRefOrGetter<AuditFilters>) {const repository=useService(auditLogsRepositoryKey);return useQuery({queryKey:['settings','audit-logs',filters],queryFn:()=>repository.list(toValue(filters))})}
