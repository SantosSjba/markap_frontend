import type { ProduccionReportesRangeParams, ProduccionReportsDashboard } from '../reportes.types'
export interface ProduccionReportesRepository {
  getDashboard: (params: ProduccionReportesRangeParams) => Promise<ProduccionReportsDashboard>
}
