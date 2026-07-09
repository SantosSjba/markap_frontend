export function formatSol(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) return 'â€”'
  return `S/ ${Number(amount).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatPct(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return 'â€”'
  return `${Number(value).toFixed(2)}%`
}

export const INTERVENTION_LEVEL_LABELS: Record<string, string> = {
  I: 'Nivel I',
  II: 'Nivel II',
  III: 'Nivel III',
}

export const INTERVENTION_LEVEL_OPTIONS = Object.entries(INTERVENTION_LEVEL_LABELS).map(
  ([value, label]) => ({ value, label }),
)

export const CURRENCY_OPTIONS = [
  { value: 'PEN', label: 'Soles (PEN)' },
  { value: 'USD', label: 'DÃ³lares (USD)' },
]

export const PAYMENT_TYPE_LABELS: Record<string, string> = {
  ABONO: 'A cuenta',
  PAGO_FINAL: 'Pago final',
  SALDO: 'Saldo',
  OTHER: 'Otro',
}

export const PAYMENT_TYPE_OPTIONS = Object.entries(PAYMENT_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}))
