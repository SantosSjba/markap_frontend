import type { BudgetSheetRowDto } from './project-budget.types'

/**
 * Vistas rápidas de Compras y contrataciones: en qué paso está cada partida.
 * Las comparten las pestañas y las alertas financieras para contar siempre lo mismo.
 */
export type PurchasesView = 'all' | 'noCost' | 'noSupplier' | 'balance' | 'purchased'

type Row = Pick<
  BudgetSheetRowDto,
  'actualCost' | 'supplierId' | 'supplierName' | 'supplierPaymentsTotal' | 'supplierBalance' | 'status'
>

export const hasSupplier = (r: Row) => !!(r.supplierId || r.supplierName?.trim())

/** Saldo con el proveedor: costo real mayor que lo abonado */
export const owesSupplier = (r: Row) =>
  (r.supplierBalance ?? 0) > 0.01 && (r.actualCost ?? 0) > 0 && (hasSupplier(r) || r.supplierPaymentsTotal > 0)

export const PURCHASES_VIEWS: Record<PurchasesView, { label: string; test: (r: Row) => boolean }> = {
  all: { label: 'Todas', test: () => true },
  noCost: { label: 'Sin costo real', test: (r) => r.actualCost == null },
  noSupplier: { label: 'Sin proveedor', test: (r) => (r.actualCost ?? 0) > 0 && !hasSupplier(r) },
  balance: { label: 'Con saldo por pagar', test: owesSupplier },
  purchased: { label: 'Compradas', test: (r) => r.status === 'PURCHASED' },
}
