import type { CommissionRow } from './finanzas.types'

/** Presentación de comisiones de venta: estados, cálculo, base y avance de pago (en la moneda de cada comisión). */

export const COMMISSION_STATUS: Record<
  string,
  { label: string; variant: 'success' | 'warning' | 'info' | 'neutral' }
> = {
  PENDING: { label: 'Pendiente', variant: 'warning' },
  PARTIAL: { label: 'Parcial', variant: 'info' },
  PAID: { label: 'Pagada', variant: 'success' },
  CANCELLED: { label: 'Anulada', variant: 'neutral' },
}

export const COMMISSION_STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'PARTIAL', label: 'Parcial' },
  { value: 'PAID', label: 'Pagada' },
  { value: 'CANCELLED', label: 'Anulada' },
]

export const CURRENCY_LABELS: Record<string, string> = {
  PEN: 'Soles (S/)',
  USD: 'Dólares (US$)',
  EUR: 'Euros (€)',
}

export const commissionStatusLabel = (status: string) => COMMISSION_STATUS[status]?.label ?? status

export const agentTypeLabel = (type?: string) =>
  type === 'INTERNAL' ? 'Interno' : type === 'EXTERNAL' ? 'Externo' : '—'

export const commissionPropertyCode = (r: CommissionRow) =>
  r.saleProcess?.property.code ?? r.closing?.property.code ?? '—'

export const commissionPropertyAddress = (r: CommissionRow) =>
  r.saleProcess?.property.addressLine ?? r.closing?.property.addressLine ?? ''

export const commissionBuyerName = (r: CommissionRow) =>
  r.closing?.buyer.fullName ?? r.saleProcess?.buyer.fullName ?? '—'

/** Moneda del inmueble (base del %); puede diferir de la comisión cuando es monto fijo */
export const commissionBaseCurrency = (r: CommissionRow) =>
  r.saleProcess?.property.saleCurrency ?? r.closing?.property.saleCurrency ?? r.currency

/** Base del cálculo: precio final si hay cierre, si no el precio de lista */
export function commissionBasePrice(r: CommissionRow): number | null {
  if (r.closing) return Number(r.closing.finalPrice)
  const p = r.saleProcess?.property.salePrice
  return p != null ? Number(p) : null
}

export function commissionCalculationLabel(r: CommissionRow): string {
  if (r.calculationType === 'FIXED') return 'Monto fijo'
  return r.percentApplied != null ? `${r.percentApplied} % del precio` : 'Porcentaje'
}

export const commissionGross = (r: CommissionRow) => r.grossAmount ?? r.amount
export const commissionNet = (r: CommissionRow) => r.netPayable ?? r.amount

export function commissionPaidAmount(r: CommissionRow): number {
  if (r.status === 'PAID') return commissionNet(r)
  if (r.status === 'CANCELLED') return 0
  const paid = (r.paymentParts ?? []).filter((p) => p.status === 'PAID').reduce((acc, p) => acc + p.amount, 0)
  return Math.min(commissionNet(r), paid)
}

export const commissionPendingAmount = (r: CommissionRow) =>
  r.status === 'CANCELLED' ? 0 : Math.max(0, commissionNet(r) - commissionPaidAmount(r))

/** Se puede pagar si no está pagada/anulada y la venta no cayó */
export const canPayCommission = (r: CommissionRow) =>
  r.status !== 'PAID' && r.status !== 'CANCELLED' && r.saleProcess?.status !== 'LOST'

/** Recalcular solo aplica a comisiones en % aún no pagadas */
export const canRecalculateCommission = (r: CommissionRow) =>
  canPayCommission(r) && r.calculationType !== 'FIXED' && r.status === 'PENDING'
