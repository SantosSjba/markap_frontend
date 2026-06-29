import { CONTABILIDAD_APP_SLUG } from '@modules/contabilidad/config/app.constants'

export const CONTABILIDAD_PERIOD_APP_SLUG = CONTABILIDAD_APP_SLUG

export type ContabilidadPeriodStatus = 'OPEN' | 'CLOSED'

export interface ContabilidadPeriodDTO {
  id: string
  legalEntityId?: string
  year: number
  month: number
  status: ContabilidadPeriodStatus
  label: string
}

export interface ContabilidadPeriodsResponse {
  year: number
  legalEntityId?: string
  periods: ContabilidadPeriodDTO[]
  monthLabels: Record<number, string>
}

export const CONTABILIDAD_PERIOD_STATUS_LABELS: Record<ContabilidadPeriodStatus, string> = {
  OPEN: 'Abierto',
  CLOSED: 'Cerrado',
}
