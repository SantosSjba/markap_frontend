import type {
  CreateProcessCommissionInput,
  SaleCommissionCalculationType,
  SaleCommissionDeductibleType,
} from './sales.types'
/**
 * Borradores de comisión del formulario de proceso: cálculo de bruto, neto y cuotas,
 * y armado del payload. En % la comisión sale del precio del inmueble y va en su moneda;
 * el monto fijo puede ir en otra moneda. Deducibles y cuotas van en la moneda de la comisión.
 */

export const MAX_PAYMENT_PARTS = 36

export const DEDUCTIBLE_TYPE_OPTIONS: { value: SaleCommissionDeductibleType; label: string }[] = [
  { value: 'TRAVEL', label: 'Pasajes / viáticos' },
  { value: 'TAX', label: 'Impuestos' },
  { value: 'NOTARY', label: 'Notaría' },
  { value: 'REGISTRY', label: 'Registros públicos' },
  { value: 'OTHER', label: 'Otros' },
]

export const DEDUCTIBLE_LABELS: Record<string, string> = Object.fromEntries(
  DEDUCTIBLE_TYPE_OPTIONS.map((o) => [o.value, o.label]),
)

export type PaymentPartDraft = { label: string; percentOfNet: string; amount: string; dueDate: string }
export type DeductibleDraft = { deductibleType: SaleCommissionDeductibleType; description: string; amount: string }
export type CommissionDraft = {
  agentId: string
  calculationType: SaleCommissionCalculationType
  value: string
  /** Moneda del monto fijo (en % manda la del inmueble) */
  currency: string
  paymentParts: PaymentPartDraft[]
  deductibles: DeductibleDraft[]
}

export function parseNum(raw: string | number | null | undefined): number | null {
  if (raw === '' || raw == null) return null
  const n = typeof raw === 'number' ? raw : Number(String(raw).replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

const round2 = (n: number) => Math.round(n * 100) / 100

function partLabel(index: number, total: number): string {
  return total === 1 ? 'Pago único' : `Parte ${index}`
}

/** Las etiquetas automáticas se recalculan al cambiar el n.º de cuotas; las escritas a mano se conservan */
const isAutoPartLabel = (label: string) => label === 'Pago único' || /^Parte \d+$/.test(label)

/** `count` partes con el 100 % repartido en partes iguales (la última absorbe el redondeo) */
export function buildEqualPaymentParts(count: number, existing?: PaymentPartDraft[]): PaymentPartDraft[] {
  const n = Math.max(1, Math.min(MAX_PAYMENT_PARTS, Math.floor(count)))
  const parts: PaymentPartDraft[] = []
  let assigned = 0
  for (let i = 0; i < n; i++) {
    const pct = i === n - 1 ? round2(100 - assigned) : round2(100 / n)
    assigned += pct
    const prev = existing?.[i]
    const prevLabel = prev?.label?.trim() ?? ''
    parts.push({
      label: prevLabel && !isAutoPartLabel(prevLabel) ? prevLabel : partLabel(i + 1, n),
      percentOfNet: String(pct),
      amount: prev?.amount ?? '',
      dueDate: prev?.dueDate ?? '',
    })
  }
  return parts
}

export function newCommissionDraft(currency = 'PEN'): CommissionDraft {
  return {
    agentId: '',
    calculationType: 'PERCENT',
    value: '',
    currency,
    paymentParts: buildEqualPaymentParts(1),
    deductibles: [],
  }
}

/** Moneda efectiva de la comisión */
export function commissionCurrency(row: CommissionDraft, propertyCurrency: string): string {
  return row.calculationType === 'PERCENT' ? propertyCurrency : row.currency || propertyCurrency
}

/** Comisión bruta; en % necesita el precio del inmueble (0 si aún no tiene) */
export function commissionGross(row: CommissionDraft, salePrice: number | null): number | null {
  const v = parseNum(row.value)
  if (v == null) return null
  if (row.calculationType === 'FIXED') return v >= 0 ? round2(v) : null
  if (v < 0 || v > 100) return null
  if (salePrice == null || salePrice <= 0) return 0
  return round2(salePrice * (v / 100))
}

export function deductiblesTotal(row: CommissionDraft): number {
  return row.deductibles.reduce((s, d) => {
    const n = parseNum(d.amount)
    return s + (n != null && n >= 0 ? n : 0)
  }, 0)
}

export function commissionNet(row: CommissionDraft, salePrice: number | null): number | null {
  const gross = commissionGross(row, salePrice)
  if (gross == null) return null
  return Math.max(0, round2(gross - deductiblesTotal(row)))
}

/** Monto de cada cuota según su % del neto (la última absorbe el redondeo) */
export function paymentPartAmounts(row: CommissionDraft, salePrice: number | null): number[] {
  const net = commissionNet(row, salePrice)
  if (net == null || net <= 0) return row.paymentParts.map(() => 0)
  const amounts: number[] = []
  let assigned = 0
  row.paymentParts.forEach((part, i) => {
    const pct = parseNum(part.percentOfNet) ?? 0
    const amt = i === row.paymentParts.length - 1 ? round2(net - assigned) : round2(net * (pct / 100))
    amounts.push(Math.max(0, amt))
    assigned += amounts[i]!
  })
  return amounts
}

export function paymentPartsPercentSum(row: CommissionDraft): number {
  return row.paymentParts.reduce((s, p) => {
    const n = parseNum(p.percentOfNet)
    return s + (n != null && n >= 0 ? n : 0)
  }, 0)
}

/** Total bruto de comisiones por moneda (no se suman monedas distintas) */
export function commissionTotalsByCurrency(
  rows: CommissionDraft[],
  salePrice: number | null,
  propertyCurrency: string,
): { currency: string; amount: number }[] {
  const totals = new Map<string, number>()
  for (const row of rows) {
    if (!row.agentId) continue
    const gross = commissionGross(row, salePrice)
    if (gross == null) continue
    const cur = commissionCurrency(row, propertyCurrency)
    totals.set(cur, round2((totals.get(cur) ?? 0) + gross))
  }
  return [...totals.entries()].map(([currency, amount]) => ({ currency, amount }))
}

/** Arma las comisiones para la API; devuelve el primer error de validación si lo hay */
export function buildCommissionsPayload(
  rows: CommissionDraft[],
  salePrice: number | null,
  propertyCurrency: string,
): { ok: true; payload: CreateProcessCommissionInput[] } | { ok: false; error: string } {
  const seen = new Set<string>()
  const payload: CreateProcessCommissionInput[] = []
  for (const row of rows) {
    if (!row.agentId) continue
    if (seen.has(row.agentId)) return { ok: false, error: 'No repita el mismo asesor en las comisiones.' }
    seen.add(row.agentId)

    const v = parseNum(row.value)
    if (v == null) return { ok: false, error: 'Complete el valor de cada comisión.' }
    if (row.calculationType === 'FIXED' && v < 0) {
      return { ok: false, error: 'El monto fijo debe ser mayor o igual a cero.' }
    }
    if (row.calculationType === 'PERCENT' && (v < 0 || v > 100)) {
      return { ok: false, error: 'El porcentaje debe estar entre 0 y 100.' }
    }

    const deductibles: NonNullable<CreateProcessCommissionInput['deductibles']> = []
    for (const d of row.deductibles) {
      const amt = parseNum(d.amount)
      if (amt == null || amt < 0) return { ok: false, error: 'Revise los montos de los deducibles.' }
      if (amt > 0) {
        deductibles.push({ deductibleType: d.deductibleType, description: d.description.trim() || null, amount: amt })
      }
    }

    if (Math.abs(paymentPartsPercentSum(row) - 100) > 0.05) {
      return {
        ok: false,
        error: `Las cuotas de cada comisión deben sumar 100 % (actual: ${round2(paymentPartsPercentSum(row))} %).`,
      }
    }
    const amounts = paymentPartAmounts(row, salePrice)
    const paymentParts = row.paymentParts.map((p, i) => {
      const pct = parseNum(p.percentOfNet)
      return {
        label: p.label.trim() || null,
        amount: (amounts[i] ?? 0) > 0 ? amounts[i]! : null,
        percentOfNet: pct != null && pct >= 0 ? pct : null,
        dueDate: p.dueDate.trim() || null,
      }
    })

    const base = { agentId: row.agentId, calculationType: row.calculationType, paymentParts, deductibles }
    payload.push(
      row.calculationType === 'FIXED'
        ? { ...base, fixedAmount: v, currency: commissionCurrency(row, propertyCurrency) }
        : { ...base, percent: v },
    )
  }
  return { ok: true, payload }
}
