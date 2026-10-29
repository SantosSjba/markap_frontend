import assert from 'node:assert/strict'
import {
  dropTarget,
  evaluateAmount,
  indentTarget,
  insertPositionAfter,
  outdentTarget,
  parsePastedRows,
  visibleRows,
  type SheetRowRef,
} from '@modules/interiorismo/features/proyecto-presupuesto/domain/budget-sheet-editing'

/** Nivel → Sala (grupo) → [a, b]; c al final de la raíz */
const rows: SheetRowRef[] = [
  { id: 'nivel', parentId: null, kind: 'GROUP' },
  { id: 'sala', parentId: 'nivel', kind: 'GROUP' },
  { id: 'a', parentId: 'sala', kind: 'ITEM' },
  { id: 'b', parentId: 'sala', kind: 'ITEM' },
  { id: 'c', parentId: null, kind: 'ITEM' },
]

export async function run() {
  let passed = 0
  const check = (name: string, fn: () => void) => {
    fn()
    console.log(`PASS ${name}`)
    passed++
  }

  check('Tab mete la fila al final del grupo anterior; sin grupo anterior no hace nada', () => {
    assert.deepEqual(indentTarget(rows, 'c'), { parentId: 'nivel', index: 1 })
    assert.equal(indentTarget(rows, 'b'), null)
    assert.equal(indentTarget(rows, 'nivel'), null)
  })
  check('Shift+Tab saca la fila justo después de su grupo; en la raíz no hace nada', () => {
    assert.deepEqual(outdentTarget(rows, 'a'), { parentId: 'nivel', index: 1 })
    assert.deepEqual(outdentTarget(rows, 'sala'), { parentId: null, index: 1 })
    assert.equal(outdentTarget(rows, 'c'), null)
  })
  check('Arrastrar: antes/después deja la fila como hermana; dentro la pone al final del grupo', () => {
    assert.deepEqual(dropTarget(rows, 'c', 'a', 'before'), { parentId: 'sala', index: 0 })
    assert.deepEqual(dropTarget(rows, 'c', 'b', 'after'), { parentId: 'sala', index: 2 })
    assert.deepEqual(dropTarget(rows, 'a', 'c', 'after'), { parentId: null, index: 2 })
    assert.deepEqual(dropTarget(rows, 'c', 'sala', 'inside'), { parentId: 'sala', index: 2 })
    assert.deepEqual(dropTarget(rows, 'b', 'a', 'before'), { parentId: 'sala', index: 0 })
  })
  check('Arrastrar: debajo de un grupo desplegado entra como primera fila; colapsado queda al lado', () => {
    assert.deepEqual(dropTarget(rows, 'c', 'sala', 'after', true), { parentId: 'sala', index: 0 })
    assert.deepEqual(dropTarget(rows, 'c', 'sala', 'after', false), { parentId: 'nivel', index: 1 })
  })
  check('Arrastrar: sin cambio o un grupo dentro de sí mismo no hace nada', () => {
    assert.equal(dropTarget(rows, 'a', 'b', 'before'), null)
    assert.equal(dropTarget(rows, 'b', 'a', 'after'), null)
    assert.equal(dropTarget(rows, 'nivel', 'a', 'before'), null)
    assert.equal(dropTarget(rows, 'sala', 'sala', 'inside'), null)
    assert.equal(dropTarget(rows, 'c', 'a', 'inside'), null)
  })
  check('Enter: en un grupo agrega dentro; en una partida agrega debajo, mismo grupo', () => {
    assert.deepEqual(insertPositionAfter(rows, 'sala'), { parentId: 'sala', afterRowId: null })
    assert.deepEqual(insertPositionAfter(rows, 'a'), { parentId: 'sala', afterRowId: 'a' })
    assert.deepEqual(insertPositionAfter(rows, null), { parentId: null, afterRowId: null })
  })
  check('Grupos plegados ocultan todo lo que contienen', () => {
    assert.deepEqual(
      visibleRows(rows, new Set(['nivel'])).map((r) => r.id),
      ['nivel', 'c'],
    )
    assert.deepEqual(
      visibleRows(rows, new Set(['sala'])).map((r) => r.id),
      ['nivel', 'sala', 'c'],
    )
  })
  check('Montos como en Excel: separador de miles y fórmulas simples', () => {
    assert.equal(evaluateAmount('1,200.50'), 1200.5)
    assert.equal(evaluateAmount('=95*2'), 190)
    assert.equal(evaluateAmount('(160 + 40) / 2'), 100)
    assert.equal(evaluateAmount(''), null)
    assert.equal(evaluateAmount('abc'), undefined)
    assert.equal(evaluateAmount('5/0'), undefined)
  })
  check('Pegar desde Excel: descripción, unidad, metrado, P.U. y costo', () => {
    assert.deepEqual(
      parsePastedRows(
        'Sofá de 3 de cuero\t5900\n1.0.1\tSillones de escritorio\tUnd\t2\t460\n\nLuminaria\tund\t1\t160\t200\r\nSolo texto',
      ),
      [
        { kind: 'ITEM', description: 'Sofá de 3 de cuero', directCost: 5900 },
        { kind: 'ITEM', code: '1.0.1', description: 'Sillones de escritorio', unit: 'Und', quantity: 2, unitPrice: 460 },
        { kind: 'ITEM', description: 'Luminaria', unit: 'und', quantity: 1, unitPrice: 160, directCost: 200 },
        { kind: 'ITEM', description: 'Solo texto' },
      ],
    )
    assert.deepEqual(parsePastedRows('una sola línea'), [])
  })

  console.log(`Hoja de presupuesto: ${passed} pruebas OK`)
}
