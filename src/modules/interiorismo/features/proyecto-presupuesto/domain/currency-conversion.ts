/**
 * Monto en la moneda del presupuesto (misma regla que la liquidación del servidor):
 * soles ↔ moneda extranjera con el tipo de cambio (soles por unidad). Sin TC aplicable → null.
 */
export function convertToBudgetCurrency(
  amount: number,
  from: string,
  to: string,
  rate: number | null | undefined,
): number | null {
  if (from === to) return amount
  if (!rate || rate <= 0) return null
  if (to === 'PEN') return Math.round(amount * rate * 100) / 100
  if (from === 'PEN') return Math.round((amount / rate) * 100) / 100
  return null
}
