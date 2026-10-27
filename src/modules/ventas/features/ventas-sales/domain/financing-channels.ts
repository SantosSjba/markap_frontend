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
