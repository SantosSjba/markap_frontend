import type { ClosingPreviewDTO } from '../closing.types'
import type { ContabilidadPeriodDTO } from '../../../periodos/domain/period.types'
export interface ContabilidadClosingRepository {
  getPreview(periodId: string): Promise<ClosingPreviewDTO>
  closePeriod(periodId: string): Promise<ContabilidadPeriodDTO>
}
