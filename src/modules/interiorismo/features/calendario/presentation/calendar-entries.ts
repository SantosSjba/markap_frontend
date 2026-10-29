import type { CalendarEntry, CalendarTone } from '@shared/presentation/components/calendar/calendar.types'
import { toCalendarDateString } from '@shared/utils/formatters'
import type { CalendarFeedItemDto, CalendarFeedSource } from '../domain/calendar.types'
import { CAL_EVENT_TYPE_LABELS } from './labels'

/** Origen visible en la leyenda (los cobros y los hitos se distinguen aunque vengan del feed). */
export type CalendarOrigin = 'MANUAL' | 'MILESTONE' | 'TASK' | 'FINANCE'

export const CALENDAR_ORIGINS: { id: CalendarOrigin; label: string; tone: CalendarTone }[] = [
  { id: 'MANUAL', label: 'Agenda', tone: 'brand' },
  { id: 'MILESTONE', label: 'Hitos y fechas', tone: 'purple' },
  { id: 'TASK', label: 'Tareas de obra', tone: 'blue' },
  { id: 'FINANCE', label: 'Cobros', tone: 'success' },
]

const ORIGIN_BY_SOURCE: Record<CalendarFeedSource, CalendarOrigin> = {
  MANUAL: 'MANUAL',
  MILESTONE: 'MILESTONE',
  EXECUTION_TASK: 'TASK',
  FINANCE_SCHEDULE: 'FINANCE',
  PROJECT: 'MILESTONE',
}

export function originOf(item: CalendarFeedItemDto): CalendarOrigin {
  return ORIGIN_BY_SOURCE[item.source] ?? 'MANUAL'
}

/** Pestaña de la ficha donde se edita lo que genera cada evento derivado */
const PROJECT_TAB_BY_SOURCE: Record<CalendarFeedSource, string> = {
  MANUAL: 'resumen',
  PROJECT: 'resumen',
  MILESTONE: 'ejecucion',
  EXECUTION_TASK: 'ejecucion',
  FINANCE_SCHEDULE: 'liquidacion',
}
export const projectTabOf = (item: CalendarFeedItemDto) => PROJECT_TAB_BY_SOURCE[item.source] ?? 'resumen'

/** Las fechas límite y las entregas se resaltan en naranja; los hitos cumplidos, en gris. */
function toneOf(item: CalendarFeedItemDto): CalendarTone {
  if (item.eventType === 'DEADLINE' || item.eventType === 'PROJECT_END') return 'orange'
  if (item.source === 'MILESTONE' && item.description === 'Completado') return 'gray'
  return CALENDAR_ORIGINS.find((o) => o.id === originOf(item))?.tone ?? 'gray'
}

const timeFormatter = new Intl.DateTimeFormat('es-PE', { timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit', hour12: false })

/** Día civil en Lima de un instante ISO (los de «todo el día» llegan a mediodía UTC). */
export function limaDay(iso: string): string {
  return toCalendarDateString(new Date(iso))
}

export function toCalendarEntry(item: CalendarFeedItemDto): CalendarEntry {
  const typeLabel = CAL_EVENT_TYPE_LABELS[item.eventType] ?? item.eventType
  return {
    id: `${item.source}:${item.id}`,
    title: item.title,
    start: limaDay(item.startsAt),
    end: item.endsAt ? limaDay(item.endsAt) : null,
    time: item.allDay ? null : timeFormatter.format(new Date(item.startsAt)),
    tone: toneOf(item),
    subtitle: [typeLabel, item.projectCode, item.assignedAgentName].filter(Boolean).join(' · '),
  }
}
