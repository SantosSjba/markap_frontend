import { addDays, addMonths, startOfMonth } from '@shared/domain/calendar-grid'

/** Escala horizontal del Gantt sobre fechas civiles `YYYY-MM-DD`. */
export interface GanttScale {
  from: string
  to: string
  days: number
}

const DAY_MS = 86_400_000
const dayIndex = (ymd: string) => Date.UTC(Number(ymd.slice(0, 4)), Number(ymd.slice(5, 7)) - 1, Number(ymd.slice(8, 10))) / DAY_MS

/**
 * Escala que cubre todas las fechas más `today`, desde el inicio del primer mes hasta el
 * fin del último (mínimo un mes). Sin fechas, muestra el mes de hoy y el siguiente.
 */
export function ganttScale(dates: readonly (string | null | undefined)[], today: string): GanttScale {
  const valid = [...dates.filter((d): d is string => !!d), today].sort()
  const from = startOfMonth(valid[0] ?? today)
  const lastMonth = startOfMonth(valid[valid.length - 1] ?? today)
  const to = addDays(addMonths(lastMonth, valid.length > 1 ? 1 : 2), -1)
  return { from, to, days: dayIndex(to) - dayIndex(from) + 1 }
}

/** Posición en % del inicio del día `ymd` dentro de la escala. */
export function ganttOffset(scale: GanttScale, ymd: string): number {
  return ((dayIndex(ymd) - dayIndex(scale.from)) / scale.days) * 100
}

/** Barra [inicio, fin] inclusiva; con una sola fecha ocupa ese día. Null si no tiene fechas. */
export function ganttBar(scale: GanttScale, start: string | null, end: string | null): { left: number; width: number } | null {
  const a = start ?? end
  const b = end && start && end >= start ? end : a
  if (!a || !b) return null
  const left = ganttOffset(scale, a)
  return { left, width: ganttOffset(scale, addDays(b, 1)) - left }
}

/** Marcas de mes (inicio de cada mes) dentro de la escala. */
export function ganttMonths(scale: GanttScale): { date: string; left: number }[] {
  const out: { date: string; left: number }[] = []
  for (let m = scale.from; m <= scale.to; m = addMonths(m, 1)) out.push({ date: m, left: ganttOffset(scale, m) })
  return out
}
