import type { BudgetRowFields, BudgetRowKind } from './project-budget.types'

/**
 * Reglas del editor tipo hoja que no dependen de la pantalla: a dónde va una fila al indentar,
 * dónde se inserta con Enter, qué filas se ven con grupos plegados, cómo se lee un monto
 * escrito como en Excel y cómo se convierten filas pegadas desde Excel.
 * Las filas llegan en orden de lectura (como las devuelve el servidor).
 */

export interface SheetRowRef {
  id: string
  parentId: string | null
  kind: BudgetRowKind
}

const siblingsOf = <T extends SheetRowRef>(rows: T[], parentId: string | null) =>
  rows.filter((r) => r.parentId === parentId)

/** Tab: la fila pasa al final del grupo que tiene justo encima (mismo nivel). */
export function indentTarget(rows: SheetRowRef[], rowId: string) {
  const row = rows.find((r) => r.id === rowId)
  if (!row) return null
  const siblings = siblingsOf(rows, row.parentId)
  const prev = siblings[siblings.findIndex((r) => r.id === rowId) - 1]
  if (!prev || prev.kind !== 'GROUP') return null
  return { parentId: prev.id, index: siblingsOf(rows, prev.id).length }
}

/** Shift+Tab: la fila sale de su grupo y queda justo después de él. */
export function outdentTarget(rows: SheetRowRef[], rowId: string) {
  const row = rows.find((r) => r.id === rowId)
  const parent = row?.parentId ? rows.find((r) => r.id === row.parentId) : null
  if (!parent) return null
  const index = siblingsOf(rows, parent.parentId).findIndex((r) => r.id === parent.id) + 1
  return { parentId: parent.parentId, index }
}

/** Zona de la fila sobre la que se suelta otra al arrastrar. */
export type DropZone = 'before' | 'after' | 'inside'

/** ¿`rowId` es `ancestorId` o está dentro de él (a cualquier profundidad)? */
export function isWithin(rows: SheetRowRef[], rowId: string | null, ancestorId: string) {
  for (let id = rowId; id; id = rows.find((r) => r.id === id)?.parentId ?? null) {
    if (id === ancestorId) return true
  }
  return false
}

/**
 * Arrastrar y soltar: a dónde va `dragId` al soltarla sobre `overId`. Antes/después la deja
 * como hermana de esa fila; «dentro» la pone al final del grupo. Soltar debajo de un grupo
 * desplegado con filas la deja como su primera fila (es lo que se ve justo debajo).
 * `null` si no se puede (un grupo dentro de sí mismo) o si la fila quedaría donde está.
 */
export function dropTarget(
  rows: SheetRowRef[],
  dragId: string,
  overId: string,
  zone: DropZone,
  expandedGroup = false,
) {
  const drag = rows.find((r) => r.id === dragId)
  const over = rows.find((r) => r.id === overId)
  if (!drag || !over || isWithin(rows, over.id, drag.id)) return null

  const others = (parentId: string | null) => siblingsOf(rows, parentId).filter((r) => r.id !== dragId)
  let target: { parentId: string | null; index: number }
  if (zone === 'inside' || (zone === 'after' && expandedGroup && others(over.id).length)) {
    if (over.kind !== 'GROUP') return null
    target = { parentId: over.id, index: zone === 'inside' ? others(over.id).length : 0 }
  } else {
    const index = others(over.parentId).findIndex((r) => r.id === over.id)
    target = { parentId: over.parentId, index: zone === 'before' ? index : index + 1 }
  }

  const current = siblingsOf(rows, drag.parentId).findIndex((r) => r.id === dragId)
  if (target.parentId === drag.parentId && target.index === current) return null
  return target
}

/** Enter: dentro de un grupo (al final) o debajo de la partida, en su mismo grupo. */
export function insertPositionAfter(rows: SheetRowRef[], rowId: string | null) {
  const row = rowId ? rows.find((r) => r.id === rowId) : null
  if (!row) return { parentId: null, afterRowId: null }
  if (row.kind === 'GROUP') return { parentId: row.id, afterRowId: null }
  return { parentId: row.parentId, afterRowId: row.id }
}

/** Filas visibles con algunos grupos plegados. */
export function visibleRows<T extends SheetRowRef>(rows: T[], collapsed: ReadonlySet<string>): T[] {
  const hidden = new Set<string>()
  return rows.filter((r) => {
    if (r.parentId && (hidden.has(r.parentId) || collapsed.has(r.parentId))) {
      hidden.add(r.id)
      return false
    }
    return true
  })
}

// ── Montos escritos como en Excel ──

/**
 * `1,200.50`, `=95*2`, `(160 + 40) / 2` → número. Vacío → `null` (borrar la celda).
 * Texto que no es un monto → `undefined` (la celda no se guarda).
 */
export function evaluateAmount(input: string): number | null | undefined {
  const text = input.trim().replace(/^=/, '').replace(/,/g, '')
  if (!text) return null
  if (!/^[\d.\s+\-*/()]+$/.test(text)) return undefined
  let pos = 0
  const peek = () => text[pos]
  const skip = () => {
    while (peek() === ' ') pos++
  }
  const parseNumber = (): number => {
    skip()
    if (peek() === '(') {
      pos++
      const v = parseSum()
      skip()
      if (peek() !== ')') throw new Error('paréntesis')
      pos++
      return v
    }
    if (peek() === '-') {
      pos++
      return -parseNumber()
    }
    const m = /^\d+(\.\d+)?|^\.\d+/.exec(text.slice(pos))
    if (!m) throw new Error('número')
    pos += m[0].length
    return Number(m[0])
  }
  const parseProduct = (): number => {
    let v = parseNumber()
    for (skip(); peek() === '*' || peek() === '/'; skip()) {
      const op = text[pos++]
      const rhs = parseNumber()
      if (op === '/' && rhs === 0) throw new Error('división')
      v = op === '*' ? v * rhs : v / rhs
    }
    return v
  }
  function parseSum(): number {
    let v = parseProduct()
    for (skip(); peek() === '+' || peek() === '-'; skip()) {
      const op = text[pos++]
      const rhs = parseProduct()
      v = op === '+' ? v + rhs : v - rhs
    }
    return v
  }
  try {
    const value = parseSum()
    skip()
    if (pos !== text.length || !Number.isFinite(value)) return undefined
    return Math.round(value * 10000) / 10000
  } catch {
    return undefined
  }
}

// ── Pegar desde Excel ──

const isCodeLike = (s: string) => /^[A-Z]?\d+(\.\d+)*$|^[A-Z](\.\d+)*$/.test(s)

/**
 * Filas pegadas (tabuladas) → partidas. Solo se trata como pegado si hay más de una línea o
 * columnas; la descripción es la primera celda de texto. Antes de ella puede ir un código;
 * después una unidad corta y montos: 1 → costo; 2 → metrado y P.U.; 3 → metrado, P.U. y costo.
 */
export function parsePastedRows(text: string): BudgetRowFields[] {
  const lines = text.replace(/\r/g, '').split('\n').filter((l) => l.trim())
  if (lines.length < 2 && !text.includes('\t')) return []
  return lines.map((line) => {
    const cells = line.split('\t').map((c) => c.trim()).filter(Boolean)
    const row: BudgetRowFields = { kind: 'ITEM' }
    let i = 0
    if (cells.length > 1 && isCodeLike(cells[0]!) && evaluateAmount(cells[1]!) === undefined) {
      row.code = cells[i++]!
    }
    while (i < cells.length && evaluateAmount(cells[i]!) !== undefined && !row.description) i++
    row.description = cells[i++] ?? ''
    if (i < cells.length && evaluateAmount(cells[i]!) === undefined && cells[i]!.length <= 6) {
      row.unit = cells[i++]!
    }
    const amounts = cells
      .slice(i)
      .map((c) => evaluateAmount(c))
      .filter((n): n is number => typeof n === 'number')
    if (amounts.length === 1) row.directCost = amounts[0]!
    if (amounts.length >= 2) {
      row.quantity = amounts[0]!
      row.unitPrice = amounts[1]!
    }
    if (amounts.length >= 3) row.directCost = amounts[2]!
    return row
  })
}
