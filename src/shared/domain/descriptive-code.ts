/**
 * Piezas de los códigos descriptivos (`CASA-EL BOSQUE-JIMÉNEZ`, `VENTA-2026-…`,
 * `PROYECTO-2026-DISEÑO-CAYMA-TORRES`). El id interno sigue siendo la referencia en la base
 * de datos; el código solo sirve para reconocer el registro.
 */

export const CODE_SEPARATOR = '-'

/** Mayúsculas, espacios simples y sin el separador dentro de cada parte */
export function normalizeCodePart(value: string | null | undefined): string {
  return (value ?? '')
    .split(CODE_SEPARATOR)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleUpperCase('es-PE')
}

/** «Local comercial» → «LOCAL»: un tipo va en una sola palabra */
export function firstCodeWord(value: string | null | undefined): string {
  return normalizeCodePart(value).split(' ')[0] ?? ''
}

/** Une las partes con el separador; las vacías se omiten */
export function joinCodeParts(parts: readonly (string | null | undefined)[]): string {
  return parts.filter(Boolean).join(CODE_SEPARATOR)
}

/**
 * Apellido a partir del nombre completo (no hay campo de apellido).
 * Personas (formato peruano «Nombres ApellidoPaterno ApellidoMaterno»): apellido paterno.
 * Empresas (RUC 20…): primera palabra de la razón social.
 */
export function suggestSurname(fullName: string, documentNumber?: string | null): string {
  const words = fullName.trim().split(/\s+/).filter(Boolean)
  if (!words.length) return ''
  const isCompany = /^20\d{9}$/.test(documentNumber ?? '')
  if (isCompany || words.length === 1) return words[0]!
  return words.length >= 3 ? words[words.length - 2]! : words[1]!
}
