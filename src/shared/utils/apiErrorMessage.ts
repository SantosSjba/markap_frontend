import { isAxiosError } from 'axios'

/**
 * Mensaje legible desde respuestas Axios (p. ej. backend Nest) u otros errores.
 */
export function getApiErrorMessage(
  error: unknown,
  fallback = 'Ocurrió un error. Intenta de nuevo.',
): string {
  if (isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string | string[]; error?: string }
      | undefined
    const raw = data?.message ?? data?.error
    if (Array.isArray(raw)) return raw.filter(Boolean).join('. ')
    if (typeof raw === 'string' && raw.trim()) return raw.trim()
  }
  if (error instanceof Error && error.message) return error.message
  return fallback
}
