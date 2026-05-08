/** Vista previa de montos (debe coincidir con la lógica del backend). */
export function computeLinePreview(
  quantity: number,
  unitPrice: number,
  utilityPct: number,
  igvPct: number,
): { lineTotal: number } {
  const base = quantity * unitPrice
  const utilityAmount = base * (utilityPct / 100)
  const amountBeforeIgv = base + utilityAmount
  const igvAmount = amountBeforeIgv * (igvPct / 100)
  const lineTotal = amountBeforeIgv + igvAmount
  return { lineTotal }
}

export function formatSol(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) return '—'
  return `S/ ${Number(amount).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export const BUDGET_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador',
  SENT: 'Enviado',
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado',
  SUPERSEDED: 'Reemplazado',
}
