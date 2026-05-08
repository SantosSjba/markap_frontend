import type { InteriorReportesRangeParams, InteriorReportsDashboard } from '../reportes.types'

export type InteriorReportesRepository = {
  getDashboard(
    params: InteriorReportesRangeParams & { applicationSlug?: string },
  ): Promise<InteriorReportsDashboard>
}
