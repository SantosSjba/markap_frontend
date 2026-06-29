import type { ContabilidadCpeLogDTO, CreateCpeLogBody } from '../cpe-log.types'

export interface ContabilidadCpeLogRepository {
  listLogs(params?: { periodId?: string; documentKind?: string; search?: string }): Promise<{
    logs: ContabilidadCpeLogDTO[]
  }>
  createLog(body: CreateCpeLogBody): Promise<ContabilidadCpeLogDTO>
}
