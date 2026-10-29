import {
  firstCodeWord,
  joinCodeParts,
  normalizeCodePart,
  suggestSurname,
} from '@shared/domain/descriptive-code'

/** Operación con la que empiezan los códigos de Interiorismo (como `VENTA-…` y `ALQUILER-…`). */
export const PROJECT_CODE_OPERATION = 'PROYECTO'

export interface InteriorProjectCodeParts {
  year: number
  /** Etiqueta del tipo de proyecto; va su primera palabra («Diseño interior» → «DISEÑO») */
  typeLabel?: string | null
  district?: string | null
  clientSurname?: string | null
}

/**
 * Código sugerido del proyecto (`PROYECTO-2026-DISEÑO-CAYMA-TORRES`). Las partes vacías se
 * omiten para mostrar la vista previa mientras se llena el formulario; el backend agrega el
 * sufijo `-2`, `-3` si el código ya existe.
 */
export function buildInteriorProjectCode(parts: InteriorProjectCodeParts): string {
  return joinCodeParts([
    PROJECT_CODE_OPERATION,
    String(parts.year),
    firstCodeWord(parts.typeLabel),
    normalizeCodePart(parts.district),
    normalizeCodePart(parts.clientSurname),
  ])
}

/** Apellido del cliente para el código (paterno en personas, primera palabra en empresas). */
export function suggestClientSurname(fullName: string, documentNumber?: string | null): string {
  return suggestSurname(fullName, documentNumber)
}
