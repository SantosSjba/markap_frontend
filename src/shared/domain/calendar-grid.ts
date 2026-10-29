/**
 * Aritmética de calendario sobre fechas civiles `YYYY-MM-DD` (sin zona horaria):
 * rejillas de mes y semana (lunes primero), rangos por vista y agrupación de eventos por día.
 */

export type CalendarViewMode = 'month' | 'week' | 'list'

export interface CalendarDayCell {
  date: string
  day: number
  inMonth: boolean
}

const pad = (n: number) => String(n).padStart(2, '0')

function toUtc(ymd: string): Date {
  return new Date(Date.UTC(Number(ymd.slice(0, 4)), Number(ymd.slice(5, 7)) - 1, Number(ymd.slice(8, 10))))
}

function fromUtc(d: Date): string {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

export function addDays(ymd: string, days: number): string {
  const d = toUtc(ymd)
  d.setUTCDate(d.getUTCDate() + days)
  return fromUtc(d)
}

/** Suma meses conservando el día cuando existe (31 ene + 1 mes → 28/29 feb). */
export function addMonths(ymd: string, months: number): string {
  const d = toUtc(ymd)
  const day = d.getUTCDate()
  d.setUTCDate(1)
  d.setUTCMonth(d.getUTCMonth() + months)
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate()
  d.setUTCDate(Math.min(day, last))
  return fromUtc(d)
}

/** Lunes de la semana de `ymd`. */
export function startOfWeek(ymd: string): string {
  const dow = (toUtc(ymd).getUTCDay() + 6) % 7
  return addDays(ymd, -dow)
}

export function startOfMonth(ymd: string): string {
  return `${ymd.slice(0, 7)}-01`
}

export function endOfMonth(ymd: string): string {
  return addDays(addMonths(startOfMonth(ymd), 1), -1)
}

/** Semanas completas (lunes→domingo) que cubren el mes de `ymd`: 28, 35 o 42 celdas. */
export function monthGrid(ymd: string): CalendarDayCell[] {
  const first = startOfMonth(ymd)
  const last = endOfMonth(ymd)
  const month = ymd.slice(0, 7)
  const cells: CalendarDayCell[] = []
  let cur = startOfWeek(first)
  const stop = addDays(startOfWeek(last), 6)
  while (cur <= stop) {
    cells.push({ date: cur, day: Number(cur.slice(8, 10)), inMonth: cur.slice(0, 7) === month })
    cur = addDays(cur, 1)
  }
  return cells
}

export function weekDays(ymd: string): string[] {
  const start = startOfWeek(ymd)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

/** Rango visible (inclusive) para consultar el feed de la vista. */
export function viewRange(view: CalendarViewMode, anchor: string): { from: string; to: string } {
  if (view === 'week') {
    const from = startOfWeek(anchor)
    return { from, to: addDays(from, 6) }
  }
  if (view === 'month') {
    return { from: startOfWeek(startOfMonth(anchor)), to: addDays(startOfWeek(endOfMonth(anchor)), 6) }
  }
  return { from: startOfMonth(anchor), to: endOfMonth(anchor) }
}

/** Mueve el ancla una unidad de la vista (semana o mes). */
export function shiftAnchor(view: CalendarViewMode, anchor: string, step: number): string {
  return view === 'week' ? addDays(anchor, 7 * step) : addMonths(anchor, step)
}

/**
 * Agrupa eventos por día civil dentro de [from, to]. Un evento de varios días aparece en
 * cada día que cubre (recortado al rango). `dayOf` convierte el instante a fecha civil.
 */
export function groupByDay<T>(
  items: readonly T[],
  range: { from: string; to: string },
  getStart: (item: T) => string,
  getEnd: (item: T) => string | null,
): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const start = getStart(item)
    const rawEnd = getEnd(item)
    const end = rawEnd && rawEnd > start ? rawEnd : start
    let cur = start < range.from ? range.from : start
    const last = end > range.to ? range.to : end
    while (cur <= last) {
      const bucket = map.get(cur)
      if (bucket) bucket.push(item)
      else map.set(cur, [item])
      cur = addDays(cur, 1)
    }
  }
  return map
}
