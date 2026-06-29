import type {
  ContabilidadPeriodsResponse,
  ContabilidadPeriodDTO,
  ContabilidadPeriodStatus,
} from '../period.types'

export interface ContabilidadPeriodsRepository {
  list(year?: number): Promise<ContabilidadPeriodsResponse>
  setStatus(id: string, status: ContabilidadPeriodStatus): Promise<ContabilidadPeriodDTO>
}
