import type { ContabilidadAccountDTO } from '@modules/contabilidad/features/plan-cuentas/domain/account.types'
import type { JournalLineFormRow } from './journal.types'
import { convertForeignToPen, FUNCTIONAL_CURRENCY } from '@modules/contabilidad/presentation/composables/useContabilidadCurrencies'

export function formatPen(amount: number | string | null | undefined): string {
  if (amount == null || amount === '') return '—'
  const n = typeof amount === 'number' ? amount : Number(String(amount).replace(',', '.'))
  if (!Number.isFinite(n)) return '—'
  return `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function parsePenInput(value: string): number {
  if (!value.trim()) return 0
  const n = Number(value.replace(',', '.'))
  if (!Number.isFinite(n) || n < 0) return NaN
  return Math.round(n * 100) / 100
}

export function roundPen(value: number): number {
  return Math.round(value * 100) / 100
}

export function isJournalBalanced(totalDebit: number, totalCredit: number): boolean {
  return Math.abs(roundPen(totalDebit) - roundPen(totalCredit)) < 0.005
}

export function sumLineAmounts(lines: JournalLineFormRow[]) {
  let totalDebit = 0
  let totalCredit = 0
  for (const line of lines) {
    const debit = parsePenInput(line.debit)
    const credit = parsePenInput(line.credit)
    if (!Number.isNaN(debit)) totalDebit += debit
    if (!Number.isNaN(credit)) totalCredit += credit
  }
  return { totalDebit: roundPen(totalDebit), totalCredit: roundPen(totalCredit) }
}

export function flattenMovementAccounts(tree: ContabilidadAccountDTO[]) {
  const options: { value: string; label: string }[] = []
  const walk = (nodes: ContabilidadAccountDTO[]) => {
    for (const node of nodes) {
      if (node.isMovement && node.isActive) {
        options.push({ value: node.id, label: `${node.code} — ${node.name}` })
      }
      if (node.children?.length) walk(node.children)
    }
  }
  walk(tree)
  return options
}

export function newJournalLineRow(): JournalLineFormRow {
  return {
    key: crypto.randomUUID(),
    accountId: '',
    debit: '',
    credit: '',
    foreignCurrency: '',
    foreignAmount: '',
    exchangeRate: '',
    costCenterId: '',
    auxiliaryRuc: '',
    auxiliaryDoc: '',
    description: '',
  }
}

export function applyForeignToPenLine(line: JournalLineFormRow) {
  const currency = line.foreignCurrency.trim().toUpperCase()
  if (!currency || currency === FUNCTIONAL_CURRENCY) return
  const foreign = parsePenInput(line.foreignAmount)
  const rate = Number(line.exchangeRate.replace(',', '.'))
  if (!Number.isFinite(foreign) || foreign <= 0 || !Number.isFinite(rate) || rate <= 0) return
  const pen = convertForeignToPen(foreign, rate).toFixed(2)
  if (line.debit.trim()) line.debit = pen
  else if (line.credit.trim()) line.credit = pen
}

export function linesToBody(lines: JournalLineFormRow[]) {
  return lines.map((line) => {
    const currency = line.foreignCurrency.trim().toUpperCase()
    const hasForeign =
      currency && currency !== FUNCTIONAL_CURRENCY && line.foreignAmount.trim()
    return {
      accountId: line.accountId,
      debit: line.debit ? parsePenInput(line.debit) : 0,
      credit: line.credit ? parsePenInput(line.credit) : 0,
      foreignCurrency: hasForeign ? currency : null,
      foreignAmount: hasForeign ? parsePenInput(line.foreignAmount) : null,
      exchangeRate: hasForeign && line.exchangeRate.trim() ? line.exchangeRate : null,
      costCenterId: line.costCenterId || null,
      auxiliaryRuc: line.auxiliaryRuc.trim() || null,
      auxiliaryDoc: line.auxiliaryDoc.trim() || null,
      description: line.description.trim() || null,
    }
  })
}

export function linesFromDetail(
  lines: {
    accountId: string
    debit: string
    credit: string
    foreignCurrency: string | null
    foreignAmount: string | null
    exchangeRate: string | null
    costCenterId: string | null
    auxiliaryRuc: string | null
    auxiliaryDoc: string | null
    description: string | null
  }[],
): JournalLineFormRow[] {
  return lines.map((line) => ({
    key: crypto.randomUUID(),
    accountId: line.accountId,
    debit: Number(line.debit) > 0 ? line.debit : '',
    credit: Number(line.credit) > 0 ? line.credit : '',
    foreignCurrency: line.foreignCurrency ?? '',
    foreignAmount: line.foreignAmount ?? '',
    exchangeRate: line.exchangeRate ?? '',
    costCenterId: line.costCenterId ?? '',
    auxiliaryRuc: line.auxiliaryRuc ?? '',
    auxiliaryDoc: line.auxiliaryDoc ?? '',
    description: line.description ?? '',
  }))
}

export function journalStatusVariant(status: string): 'success' | 'warning' | 'neutral' | 'error' {
  if (status === 'POSTED') return 'success'
  if (status === 'DRAFT') return 'warning'
  if (status === 'REVERSED') return 'neutral'
  return 'neutral'
}
