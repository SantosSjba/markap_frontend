import type { BudgetRowFields } from './project-budget.types'

/** Copia de referencia: el presupuesto conserva sus propios precios, sin modificar catálogo ni stock. */
export function catalogReferencePrice(
  reference: { currency: string; price: number },
  budgetCurrency: string,
): number | null {
  return reference.currency === budgetCurrency &&
    Number.isFinite(reference.price)
    ? reference.price
    : null
}

export function catalogBudgetRow(input: {
  description: string
  unit: string
  quantity: number
  unitPrice: number
  supplierId?: string | null
}): BudgetRowFields {
  if (
    !input.description.trim() ||
    !input.unit.trim() ||
    !Number.isFinite(input.quantity) ||
    input.quantity <= 0 ||
    !Number.isFinite(input.unitPrice) ||
    input.unitPrice < 0
  ) {
    throw new Error(
      'Ingrese descripción, unidad, cantidad mayor que cero y costo unitario válido.',
    )
  }
  return {
    kind: 'ITEM',
    description: input.description.trim(),
    unit: input.unit.trim(),
    quantity: input.quantity,
    unitPrice: input.unitPrice,
    directCost: null,
    supplierId: input.supplierId || null,
    status: 'PENDING',
  }
}
