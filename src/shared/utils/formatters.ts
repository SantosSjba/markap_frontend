/**
 * Date/number formatters — Peru (America/Lima) as system timezone.
 *
 * Calendar dates (YYYY-MM-DD / date-only API fields): use parseCalendarDate /
 * formatDate / formatShortDate / toCalendarDateString.
 * Real timestamps (createdAt, postedAt): use formatDateTime only (never parseCalendarDate).
 */

export const PERU_TIME_ZONE = 'America/Lima'
export const PERU_LOCALE = 'es-PE'

/**
 * Parse calendar dates (YYYY-MM-DD / ISO prefix) as local civil day.
 * `new Date('2026-06-14')` is UTC midnight → previous day in America/Lima.
 */
export function parseCalendarDate(value: Date | string | number): Date {
  if (value instanceof Date) return value
  if (typeof value === 'number') return new Date(value)
  const m = String(value).trim().match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) {
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  }
  return new Date(value)
}

/** Today's civil date in America/Lima as `YYYY-MM-DD` (for `<input type="date">`). */
export function toCalendarDateString(value: Date | string | number = new Date()): string {
  if (typeof value === 'string') {
    const m = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (m) return `${m[1]}-${m[2]}-${m[3]}`
  }
  const d = value instanceof Date ? value : new Date(value)
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: PERU_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

/**
 * Format a calendar date for display (es-PE, América/Lima civil day).
 */
export function formatDate(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {},
): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: PERU_TIME_ZONE,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  }
  // For date-only values, format the civil day at local noon so TZ option is stable.
  const parsed = parseCalendarDate(date)
  const civil = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 12, 0, 0)
  return new Intl.DateTimeFormat(PERU_LOCALE, defaultOptions).format(civil)
}

/** Format calendar date as DD/MM/YYYY (es-PE). */
export function formatShortDate(date: Date | string | number): string {
  return formatDate(date, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

/**
 * Format a real timestamp (createdAt, postedAt, …) in America/Lima.
 * Do NOT pass date-only fields here if you only care about the civil day —
 * use formatShortDate instead.
 */
export function formatDateTime(date: Date | string | number): string {
  return new Intl.DateTimeFormat(PERU_LOCALE, {
    timeZone: PERU_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

/**
 * Format number to currency
 */
export function formatCurrency(
  amount: number,
  currency: string = 'PEN',
  locale: string = PERU_LOCALE,
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount)
}

/**
 * Format number with thousand separators
 */
export function formatNumber(
  num: number,
  decimals: number = 0,
  locale: string = PERU_LOCALE,
): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num)
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let unitIndex = 0

  while (bytes >= 1024 && unitIndex < units.length - 1) {
    bytes /= 1024
    unitIndex++
  }

  return `${bytes.toFixed(2)} ${units[unitIndex]}`
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number = 50): string {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}...`
}

/**
 * Capitalize first letter
 */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

/**
 * Format phone number
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')

  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')
  }

  return phone
}
