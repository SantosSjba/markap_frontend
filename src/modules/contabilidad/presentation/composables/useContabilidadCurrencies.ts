import { useQuery } from '@tanstack/vue-query'
import { apiClient } from '@core/api/apiClient'

export interface ContabilidadCurrencyDTO {
  id: string
  code: string
  name: string
  symbol: string
}

export const contabilidadCurrencyKeys = {
  root: ['contabilidad-currencies'] as const,
  list: () => [...contabilidadCurrencyKeys.root, 'list'] as const,
}

export function useContabilidadCurrencies() {
  return useQuery({
    queryKey: contabilidadCurrencyKeys.list(),
    queryFn: () => apiClient.get<ContabilidadCurrencyDTO[]>('/properties/currencies').then((r) => r.data),
    staleTime: 60_000,
  })
}

export const FUNCTIONAL_CURRENCY = 'PEN'

export const CURRENCY_SYMBOL: Record<string, string> = {
  PEN: 'S/',
  USD: 'US$',
  EUR: '€',
}

export function currencySymbol(code?: string | null): string {
  if (!code) return CURRENCY_SYMBOL.PEN ?? 'S/'
  return CURRENCY_SYMBOL[code] ?? code
}

export function formatMoney(amount: number | string | null | undefined, currencyCode = FUNCTIONAL_CURRENCY): string {
  if (amount == null || amount === '') return '—'
  const n = typeof amount === 'number' ? amount : Number(String(amount).replace(',', '.'))
  if (!Number.isFinite(n)) return '—'
  const sym = currencySymbol(currencyCode)
  return `${sym} ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function convertForeignToPen(foreignAmount: number, exchangeRate: number): number {
  return Math.round(foreignAmount * exchangeRate * 100) / 100
}

export function isForeignCurrency(code?: string | null): boolean {
  return Boolean(code && code.trim().toUpperCase() !== FUNCTIONAL_CURRENCY)
}
