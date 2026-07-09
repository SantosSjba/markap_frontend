import type { ArquitecturaReportesRangeParams, ArquitecturaReportsDashboard } from '../reportes.types'

export type ArquitecturaReportesRepository = {
  getDashboard(
    params: ArquitecturaReportesRangeParams & { applicationSlug?: string },
  ): Promise<ArquitecturaReportsDashboard>
}
