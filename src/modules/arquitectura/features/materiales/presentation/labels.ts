export function formatSol(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) return '—'
  return `S/ ${Number(amount).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatQty(q: number | null | undefined): string {
  if (q == null || Number.isNaN(q)) return '—'
  return Number(q).toLocaleString('es-PE', { maximumFractionDigits: 4 })
}
