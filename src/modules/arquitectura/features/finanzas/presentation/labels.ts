export const SCHEDULE_KIND_LABELS: Record<string, string> = {
  ADVANCE: 'Adelanto',
  INSTALLMENT: 'Cuota',
  OTHER: 'Otro ingreso programado',
}

export const SCHEDULE_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  PARTIAL: 'Parcial',
  PAID: 'Pagado',
  WAIVED: 'Condonado',
}

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  PAID: 'Pagado',
  CANCELLED: 'Anulado',
}

export const COST_CATEGORY_FIN_LABELS: Record<string, string> = {
  LABOR: 'Mano de obra',
  MATERIAL: 'Compras / materiales',
  TRANSPORT: 'Transporte',
  EXPENSE: 'Otros gastos',
}

export function formatSol(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) return '—'
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount)
}
