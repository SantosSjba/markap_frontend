import type { InteriorReportsDashboard } from '../domain/reportes.types'

export function reportChartItems(
  data: InteriorReportsDashboard | undefined,
  currency?: string,
) {
  return (data?.monthly ?? []).map((m) => ({
    key: m.key,
    year: Number(m.key.slice(0, 4)),
    monthName: new Intl.DateTimeFormat('es-PE', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(`${m.key}-15T12:00:00Z`)),
    value: currency
      ? (m.collections.find((x) => x.currency === currency)?.amount ?? 0)
      : m.projects,
  }))
}
