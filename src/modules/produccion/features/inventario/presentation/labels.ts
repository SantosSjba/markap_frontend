export function formatSol(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) return '—'
  return `S/ ${Number(amount).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatQty(qty: number | null | undefined, unit?: string): string {
  if (qty == null || Number.isNaN(qty)) return '—'
  const n = Number(qty)
  const formatted = n % 1 === 0 ? n.toLocaleString('es-PE') : n.toLocaleString('es-PE', { maximumFractionDigits: 4 })
  return unit ? `${formatted} ${unit}` : formatted
}

export const MATERIAL_CATEGORIES = ['Tableros', 'Herrajes', 'Adhesivos', 'Acabados', 'Otros'] as const

export const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  IN: 'Ingreso',
  OUT: 'Salida',
  ADJUST: 'Ajuste',
}

export const MOVEMENT_TYPE_OPTIONS = [
  { value: 'IN', label: 'Ingreso' },
  { value: 'OUT', label: 'Salida' },
  { value: 'ADJUST', label: 'Ajuste de stock' },
] as const
