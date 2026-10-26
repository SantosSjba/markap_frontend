/**
 * Código descriptivo de propiedades: Tipo + Distrito + Apellido del propietario principal
 * (ej. `CASA-EL BOSQUE-JIMÉNEZ`). La operación y el año los agrega el contrato
 * (`ALQUILER-2026-CASA-EL BOSQUE-JIMÉNEZ`). El id interno sigue siendo la referencia
 * en la base de datos; este código es solo para reconocer la propiedad.
 */

export const PROPERTY_CODE_SEPARATOR = '-'

/** Mayúsculas, espacios simples y sin el separador dentro de cada parte */
function normalizePart(value: string | null | undefined): string {
  return (value ?? '')
    .split(PROPERTY_CODE_SEPARATOR)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleUpperCase('es-PE')
}

/** «Local comercial» → «LOCAL»: el tipo va en una palabra */
export function propertyTypeCodeWord(typeName: string | null | undefined): string {
  return normalizePart(typeName).split(' ')[0] ?? ''
}

export interface PropertyCodeParts {
  typeName?: string | null
  location?: string | null
  ownerSurname?: string | null
}

/** Arma el código con las partes disponibles; las vacías se omiten */
export function buildPropertyCode(parts: PropertyCodeParts): string {
  return [
    propertyTypeCodeWord(parts.typeName),
    normalizePart(parts.location),
    normalizePart(parts.ownerSurname),
  ]
    .filter(Boolean)
    .join(PROPERTY_CODE_SEPARATOR)
}

/**
 * Apellido del propietario a partir de su nombre completo (no hay campo de apellido).
 * Personas (formato peruano «Nombres ApellidoPaterno ApellidoMaterno»): apellido paterno.
 * Empresas (RUC 20…): primera palabra de la razón social.
 */
export function suggestOwnerSurname(fullName: string, documentNumber?: string | null): string {
  const words = fullName.trim().split(/\s+/).filter(Boolean)
  if (!words.length) return ''
  const isCompany = /^20\d{9}$/.test(documentNumber ?? '')
  if (isCompany || words.length === 1) return words[0]!
  return words.length >= 3 ? words[words.length - 2]! : words[1]!
}
