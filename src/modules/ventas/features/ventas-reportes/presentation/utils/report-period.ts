import { computed, ref } from 'vue'
import { toCalendarDateString } from '@shared/utils/formatters'
import type { MonthlyBarItem } from '@shared/presentation/components/reports/MonthlyBarChart.vue'
import type { VentasSummaryParams } from '../../domain/reportes.types'

/**
 * Periodo de Reportes de Ventas (como en Alquileres): año completo, mes, rango o todo el historial.
 * El detalle se agrupa por mes, salvo «Todo» y rangos largos, que se agrupan por año.
 */
export type ReportPeriodMode = 'year' | 'month' | 'range' | 'all'

export const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

export const PERIOD_MODE_OPTIONS = [
  { value: 'year', label: 'Por año' },
  { value: 'month', label: 'Por mes' },
  { value: 'range', label: 'Rango de fechas' },
  { value: 'all', label: 'Todo' },
]

/** Desde cuándo cuenta «Todo» */
const ALL_TIME_START = '2000-01-01'

export function useReportPeriod() {
  const now = new Date()
  const mode = ref<ReportPeriodMode>('year')
  const year = ref(now.getFullYear())
  const month = ref(now.getMonth() + 1)
  const startDate = ref('')
  const endDate = ref('')

  const yearOptions = Array.from({ length: 6 }, (_, i) => {
    const y = now.getFullYear() - i
    return { value: y, label: String(y) }
  })
  const monthOptions = MONTH_NAMES.map((label, i) => ({ value: i + 1, label }))

  const params = computed<VentasSummaryParams>(() => {
    const today = toCalendarDateString()
    if (mode.value === 'all') return { startDate: ALL_TIME_START, endDate: today, granularity: 'year' }
    if (mode.value === 'month') {
      const m = String(month.value).padStart(2, '0')
      const last = new Date(year.value, month.value, 0).getDate()
      return { startDate: `${year.value}-${m}-01`, endDate: `${year.value}-${m}-${last}`, granularity: 'month' }
    }
    if (mode.value === 'range') {
      const start = startDate.value || `${year.value}-01-01`
      const end = endDate.value || today
      const months =
        (Number(end.slice(0, 4)) - Number(start.slice(0, 4))) * 12 + Number(end.slice(5, 7)) - Number(start.slice(5, 7))
      return { startDate: start, endDate: end, granularity: months > 24 ? 'year' : 'month' }
    }
    return { startDate: `${year.value}-01-01`, endDate: `${year.value}-12-31`, granularity: 'month' }
  })

  /** Texto del periodo para títulos y archivos */
  const label = computed(() => {
    if (mode.value === 'all') return 'Todo el historial'
    if (mode.value === 'month') return `${MONTH_NAMES[month.value - 1]} ${year.value}`
    if (mode.value === 'range') return `${params.value.startDate} a ${params.value.endDate}`
    return String(year.value)
  })

  return { mode, year, month, startDate, endDate, yearOptions, monthOptions, params, label }
}

/** `2026-03` → «Marzo 2026»; `2026` → «2026» */
export function periodName(period: string): string {
  if (period.length === 4) return period
  return `${MONTH_NAMES[Number(period.slice(5, 7)) - 1]} ${period.slice(0, 4)}`
}

/**
 * Periodos del gráfico: todos los meses/años del rango, aunque no tengan movimiento,
 * para que las barras no salten meses vacíos.
 */
export function periodKeys(params: VentasSummaryParams, present: string[]): string[] {
  const startY = Number(params.startDate.slice(0, 4))
  const endY = Number(params.endDate.slice(0, 4))
  if (params.granularity === 'year') {
    // «Todo»: desde el primer año con datos
    const first = present.length ? Math.min(...present.map((p) => Number(p.slice(0, 4)))) : endY
    const from = Math.max(startY, first)
    return Array.from({ length: endY - from + 1 }, (_, i) => String(from + i))
  }
  const keys: string[] = []
  let y = startY
  let m = Number(params.startDate.slice(5, 7))
  const endM = Number(params.endDate.slice(5, 7))
  while (y < endY || (y === endY && m <= endM)) {
    keys.push(`${y}-${String(m).padStart(2, '0')}`)
    m += 1
    if (m > 12) {
      m = 1
      y += 1
    }
  }
  return keys
}

/** Barras del gráfico para una serie (`valueOf` devuelve 0 si el periodo no tiene datos) */
export function barItems(
  keys: string[],
  valueOf: (period: string) => number,
  tooltip: (period: string, value: number) => string,
): MonthlyBarItem[] {
  const multiYear = new Set(keys.map((k) => k.slice(0, 4))).size > 1
  return keys.map((k) => {
    const value = valueOf(k)
    const name = k.length === 4 ? k : MONTH_NAMES[Number(k.slice(5, 7)) - 1]!
    return {
      key: k,
      monthName: multiYear && k.length > 4 ? periodName(k) : name,
      year: Number(k.slice(0, 4)),
      value,
      tooltip: tooltip(k, value),
    }
  })
}

/** Monedas presentes, soles primero */
export function sortCurrencies(list: Iterable<string>): string[] {
  return [...new Set(list)].sort((a, b) => (a === 'PEN' ? -1 : b === 'PEN' ? 1 : a.localeCompare(b)))
}
