import { FALLBACK_FURNITURE_CATEGORY_OPTIONS } from '../../configuracion/domain/config.defaults'
export function formatSol(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) return '—'
  return `S/ ${Number(amount).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatDimensions(
  width: number | null | undefined,
  depth: number | null | undefined,
  height: number | null | undefined,
): string {
  if (width == null && depth == null && height == null) return '—'
  const w = width != null ? `${width}` : '—'
  const d = depth != null ? `${depth}` : '—'
  const h = height != null ? `${height}` : '—'
  return `${w} × ${d} × ${h} cm`
}

export const FURNITURE_CATEGORIES = FALLBACK_FURNITURE_CATEGORY_OPTIONS.map((c) => c.label)
