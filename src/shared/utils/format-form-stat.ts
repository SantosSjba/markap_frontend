/** Valor numérico de formulario para resúmenes (evita mostrar "undefined"). */
export function formatFormStat(value: string | number | null | undefined): string {
  if (value === '' || value === null || value === undefined) return '—'
  const n = Number(value)
  if (Number.isFinite(n)) return String(n)
  return '—'
}

export function formatFormArea(value: string | number | null | undefined): string {
  if (value === '' || value === null || value === undefined) return '—'
  const n = Number(value)
  return Number.isFinite(n) ? `${n}m²` : '—'
}
