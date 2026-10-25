/** Parte estable de una query key (evita meter objetos enteros en el array). */
export function sk(value: unknown): string {
  if (value === undefined || value === null) return ''
  return String(value)
}
