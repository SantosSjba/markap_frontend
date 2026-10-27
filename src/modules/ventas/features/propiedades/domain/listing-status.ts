/** Estados comerciales de una propiedad en Ventas (listado, filtros, formulario y Excel). */
export type VentasListingStatus = 'AVAILABLE' | 'RESERVED' | 'SOLD'

export const VENTAS_LISTING_STATUS_OPTIONS: { value: VentasListingStatus; label: string }[] = [
  { value: 'AVAILABLE', label: 'Disponible' },
  { value: 'RESERVED', label: 'Separada' },
  { value: 'SOLD', label: 'Vendida' },
]

export function listingStatusLabel(status: string | null | undefined): string {
  if (!status) return '—'
  return VENTAS_LISTING_STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status
}

export function listingStatusVariant(
  status: string | null | undefined,
): 'success' | 'info' | 'warning' | 'neutral' {
  if (status === 'AVAILABLE') return 'info'
  if (status === 'RESERVED') return 'warning'
  if (status === 'SOLD') return 'success'
  return 'neutral'
}
