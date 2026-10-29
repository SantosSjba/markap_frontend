/** Tonos de color disponibles para los eventos del calendario (clases en `calendar-tones.ts`). */
export type CalendarTone = 'brand' | 'purple' | 'blue' | 'success' | 'warning' | 'orange' | 'error' | 'gray'

/** Evento ya normalizado para las vistas del calendario. Fechas civiles `YYYY-MM-DD`. */
export interface CalendarEntry {
  id: string
  title: string
  start: string
  end: string | null
  /** Hora visible ("09:30") o null para eventos de todo el día. */
  time: string | null
  tone: CalendarTone
  /** Texto secundario (proyecto, responsable…). */
  subtitle?: string | null
  /** Marca visual de evento cumplido / cerrado. */
  done?: boolean
}
