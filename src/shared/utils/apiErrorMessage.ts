import { isAxiosError } from 'axios'
/** Contacto de soporte opcional (VITE_SUPPORT_CONTACT), p. ej. correo o teléfono. */
const SUPPORT_CONTACT = String(import.meta.env.VITE_SUPPORT_CONTACT ?? '').trim()

export const SUPPORT_HINT = SUPPORT_CONTACT
  ? `Si el problema continúa, comunícate con soporte (${SUPPORT_CONTACT}).`
  : 'Si el problema continúa, comunícate con soporte.'

const DEFAULT_FALLBACK = 'No se pudo completar la operación. Inténtalo nuevamente.'

/**
 * Textos que no deben llegar al usuario: errores HTTP genéricos, de red, de
 * JavaScript, de base de datos o mensajes técnicos en inglés.
 */
const TECHNICAL_PATTERNS = [
  /internal server error/i,
  /request failed with status code/i,
  /network error/i,
  /timeout of \d+ms/i,
  /^cannot (get|post|put|patch|delete) /i,
  /invalid `.*` invocation/i,
  /prisma/i,
  /\bECONN\w*/,
  /unexpected (token|end of json)/i,
  /is not a function|cannot read propert|is not defined|undefined|\bnull\b/i,
  /\bstatus code\b|\b(4|5)\d\d\b.*error|error.*\b(4|5)\d\d\b/i,
  /with identifier/i,
  /^[A-Z][A-Z0-9_]+$/, // códigos internos, p. ej. PROJECT_NOT_FOUND
  /\b(not found|must be|should|is required|are required|invalid|only .* can|cannot|failed|missing|already exists|forbidden|unauthorized|bad request|conflict)\b/i,
]

export function isTechnicalErrorMessage(message: string): boolean {
  const text = message.trim()
  if (!text || text.length > 400) return true
  return TECHNICAL_PATTERNS.some((pattern) => pattern.test(text))
}

function withPeriod(text: string): string {
  const t = text.trim()
  return /[.!?)]$/.test(t) ? t : `${t}.`
}

function serverMessage(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null
  const raw =
    (data as { message?: unknown; error?: unknown }).message ?? (data as { error?: unknown }).error
  const parts = (Array.isArray(raw) ? raw : [raw]).filter(
    (v): v is string => typeof v === 'string' && v.trim() !== '' && !isTechnicalErrorMessage(v),
  )
  return parts.length ? parts.map(withPeriod).join(' ') : null
}

/**
 * Mensaje comprensible para el usuario a partir de cualquier error (Axios,
 * Error de JavaScript u otro). Nunca devuelve textos técnicos: en fallos del
 * servidor o de conexión indica que se comunique con soporte.
 *
 * `fallback` describe la acción que falló (p. ej. "No se pudo guardar el pago").
 */
export function getApiErrorMessage(error: unknown, fallback = DEFAULT_FALLBACK): string {
  const base = withPeriod(fallback)

  if (isAxiosError(error)) {
    if (error.code === 'ERR_CANCELED') return base
    const response = error.response
    if (!response) {
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT')
        return `El servidor tardó demasiado en responder. Inténtalo nuevamente en unos minutos. ${SUPPORT_HINT}`
      return `No se pudo conectar con el servidor. Revisa tu conexión a internet e inténtalo nuevamente. ${SUPPORT_HINT}`
    }

    const status = response.status
    const fromServer = serverMessage(response.data)
    if (status >= 500) return `${base} Ocurrió un problema en el servidor. ${SUPPORT_HINT}`
    if (status === 401) return fromServer ?? 'Tu sesión expiró. Inicia sesión nuevamente.'
    if (fromServer) return fromServer
    switch (status) {
      case 403:
        return `No tienes permisos para realizar esta acción. ${SUPPORT_HINT}`
      case 404:
        return 'No se encontró la información solicitada. Es posible que haya sido eliminada; actualiza la página e inténtalo nuevamente.'
      case 409:
        return 'La información cambió o ya existe un registro con esos datos. Actualiza la página y revisa los datos.'
      case 413:
        return 'El archivo es demasiado grande. Usa un archivo de menor tamaño.'
      case 429:
        return 'Se realizaron demasiadas solicitudes seguidas. Espera un momento e inténtalo nuevamente.'
      case 400:
      case 422:
        return `${base} Revisa los datos ingresados.`
      default:
        return `${base} ${SUPPORT_HINT}`
    }
  }

  if (error instanceof Error && error.message && !isTechnicalErrorMessage(error.message))
    return withPeriod(error.message)
  if (typeof error === 'string' && error.trim() && !isTechnicalErrorMessage(error))
    return withPeriod(error)
  return `${base} ${SUPPORT_HINT}`
}

export function getApiErrorStatus(error: unknown): number | undefined {
  return isAxiosError(error) ? error.response?.status : undefined
}
