import { formatCurrency, formatCurrencyRounded } from './formatters'

/** Monedas con las que trabajan los módulos (proyectos, contratos, ventas, compras). */
export type CurrencyCode = 'PEN' | 'USD' | 'EUR'

export const SUPPORTED_CURRENCIES: readonly CurrencyCode[] = ['PEN', 'USD', 'EUR']

const DEFAULT_CURRENCY: CurrencyCode = 'PEN'

/** Monto con su símbolo (`S/ 1,200.00`); vacío o inválido se muestra como `—`. */
export function formatMoney(amount: number | null | undefined, currency?: string | null): string {
  if (amount == null || !Number.isFinite(amount)) return '—'
  return formatCurrency(amount, currency || DEFAULT_CURRENCY)
}

export interface CurrencyAmount {
  currency: string
  amount: number
}

/**
 * Suma montos agrupados por moneda (nunca mezcla monedas). Ignora montos vacíos;
 * sin moneda cuenta como soles. La moneda con mayor monto va primero.
 */
export function sumByCurrency<T>(
  items: readonly T[],
  currencyOf: (item: T) => string | null | undefined,
  amountOf: (item: T) => number | null | undefined,
): CurrencyAmount[] {
  const totals = new Map<string, number>()
  for (const item of items) {
    const amount = amountOf(item)
    if (amount == null || !Number.isFinite(amount)) continue
    const currency = currencyOf(item) || DEFAULT_CURRENCY
    totals.set(currency, (totals.get(currency) ?? 0) + amount)
  }
  return [...totals]
    .map(([currency, amount]) => ({ currency, amount }))
    .sort((a, b) => b.amount - a.amount)
}

/**
 * Totales de varias monedas para una tarjeta: la primera moneda como cifra principal
 * y el resto en el subtítulo (`US$ 5.00 · € 2.00`).
 */
export function splitCurrencyTotals(
  totals: readonly CurrencyAmount[],
  rounded = false,
): { main: string; rest: string } {
  const format = rounded ? formatCurrencyRounded : formatCurrency
  const [first, ...others] = totals
  return {
    main: first ? format(first.amount, first.currency) : format(0, DEFAULT_CURRENCY),
    rest: others.map((t) => format(t.amount, t.currency)).join(' · '),
  }
}
