import type { SaleFinancingChannel } from './sales.types'
/** Bancos y medios de pago del proceso, agrupados por categoría (alta y detalle del proceso). */

export const FINANCING_CATEGORY_LABEL: Record<string, string> = {
  BANK: 'Bancos',
  PAYMENT_METHOD: 'Medios de pago',
  OWN_FUNDS: 'Fondos propios',
  OTHER: 'Otros',
}

const CATEGORY_ORDER = ['BANK', 'PAYMENT_METHOD', 'OWN_FUNDS', 'OTHER']

export function financingChannelOptions(channels: SaleFinancingChannel[]) {
  const grouped = CATEGORY_ORDER.flatMap((cat) =>
    channels
      .filter((c) => c.category === cat)
      .map((c) => ({ value: c.id, label: `${FINANCING_CATEGORY_LABEL[cat] ?? cat}: ${c.name}` })),
  )
  return [{ value: '', label: 'Sin especificar' }, ...grouped]
}

/**
 * Opciones por código del catálogo, filtradas por categoría (cumplimiento legal guarda el código).
 * Un valor de texto registrado antes del catálogo se conserva como opción para no perderlo.
 */
export function financingChannelCodeOptions(
  channels: SaleFinancingChannel[],
  categories: readonly string[],
  current?: string | null,
) {
  const options = CATEGORY_ORDER.filter((cat) => categories.includes(cat)).flatMap((cat) =>
    channels
      .filter((c) => c.category === cat)
      .map((c) => ({
        value: c.code,
        label: categories.length > 1 ? `${FINANCING_CATEGORY_LABEL[cat] ?? cat}: ${c.name}` : c.name,
      })),
  )
  const legacy = current?.trim()
  const withLegacy =
    legacy && !options.some((o) => o.value === legacy)
      ? [...options, { value: legacy, label: `${legacy} (registrado antes del catálogo)` }]
      : options
  return [{ value: '', label: 'Sin especificar' }, ...withLegacy]
}
