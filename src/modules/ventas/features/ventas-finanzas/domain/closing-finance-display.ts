/** Etiquetas de cobranza al comprador y gastos de documentación de un cierre */

export const BUYER_PAYMENT_KIND_OPTIONS = [
  { value: 'DOWN_PAYMENT', label: 'Inicial' },
  { value: 'INSTALLMENT', label: 'Cuota' },
]

export const DOC_COST_TYPE_OPTIONS = [
  { value: 'NOTARY', label: 'Notaría' },
  { value: 'REGISTRY', label: 'Registros públicos' },
  { value: 'OTHER', label: 'Otro' },
]

export const buyerPaymentKindLabel = (kind: string) =>
  BUYER_PAYMENT_KIND_OPTIONS.find((o) => o.value === kind)?.label ?? kind

export const docCostTypeLabel = (type: string) => DOC_COST_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? 'Otro'

const PAYMENT_STATUS: Record<string, { label: string; variant: 'success' | 'warning' | 'error' }> = {
  PENDING: { label: 'Pendiente', variant: 'warning' },
  OVERDUE: { label: 'Atrasado', variant: 'error' },
  PAID: { label: 'Pagado', variant: 'success' },
}

export const buyerPaymentStatus = (displayStatus: string) => PAYMENT_STATUS[displayStatus] ?? PAYMENT_STATUS.PENDING!
