import {
  barItems,
  periodKeys,
  periodName,
  type ReportPeriodParams,
} from '@shared/presentation/components/reports/report-period'
import type { InteriorReportsDashboard, ReportMoney } from '../domain/reportes.types'

/**
 * Series mensuales del reporte, agrupadas por mes o por año según el periodo
 * (el backend las entrega por mes; «Todo» y los rangos largos se suman por año).
 */
export function monthlyBars(
  data: InteriorReportsDashboard | undefined,
  params: ReportPeriodParams,
  pick: (m: InteriorReportsDashboard['monthly'][number]) => number,
  tooltip: (period: string, value: number) => string,
) {
  const monthly = (data?.monthly ?? []).filter((m) => pick(m) > 0)
  const keys = periodKeys(
    params,
    monthly.map((m) => m.key),
  )
  const valueOf = (k: string) => (data?.monthly ?? []).filter((m) => m.key.startsWith(k)).reduce((s, m) => s + pick(m), 0)
  return barItems(keys, valueOf, tooltip)
}

export const amountIn = (list: readonly ReportMoney[], currency: string) =>
  list.find((m) => m.currency === currency)?.amount ?? 0

export { periodName }
