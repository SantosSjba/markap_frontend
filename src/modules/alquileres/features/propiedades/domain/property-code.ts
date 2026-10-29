import {
  CODE_SEPARATOR,
  firstCodeWord,
  joinCodeParts,
  normalizeCodePart,
  suggestSurname,
} from '@shared/domain/descriptive-code'

/**
 * Código descriptivo de propiedades: Tipo + Distrito + Apellido del propietario principal
 * (ej. `CASA-EL BOSQUE-JIMÉNEZ`). La operación y el año los agrega el contrato
 * (`ALQUILER-2026-CASA-EL BOSQUE-JIMÉNEZ`). El id interno sigue siendo la referencia
 * en la base de datos; este código es solo para reconocer la propiedad.
 */

export const PROPERTY_CODE_SEPARATOR = CODE_SEPARATOR

/** «Local comercial» → «LOCAL»: el tipo va en una palabra */
export function propertyTypeCodeWord(typeName: string | null | undefined): string {
  return firstCodeWord(typeName)
}

export interface PropertyCodeParts {
  typeName?: string | null
  location?: string | null
  ownerSurname?: string | null
}

/** Arma el código con las partes disponibles; las vacías se omiten */
export function buildPropertyCode(parts: PropertyCodeParts): string {
  return joinCodeParts([
    propertyTypeCodeWord(parts.typeName),
    normalizeCodePart(parts.location),
    normalizeCodePart(parts.ownerSurname),
  ])
}

/** Apellido del propietario principal (paterno en personas, primera palabra en empresas). */
export function suggestOwnerSurname(fullName: string, documentNumber?: string | null): string {
  return suggestSurname(fullName, documentNumber)
}
