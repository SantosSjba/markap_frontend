import assert from 'node:assert/strict'
import { formatMoney, splitCurrencyTotals, sumByCurrency } from '@shared/utils/money'

export async function run() {
  let passed = 0
  const check = (name: string, fn: () => void) => {
    fn()
    console.log(`PASS ${name}`)
    passed++
  }

  check('Monto con el símbolo del catálogo en cada moneda', () => {
    assert.equal(formatMoney(1200, 'PEN'), 'S/ 1,200.00')
    assert.equal(formatMoney(800, 'USD'), 'US$ 800.00')
    assert.equal(formatMoney(50, 'EUR'), '€ 50.00')
  })
  check('Monto vacío o inválido se muestra como guion; sin moneda va en soles', () => {
    assert.equal(formatMoney(null, 'PEN'), '—')
    assert.equal(formatMoney(undefined), '—')
    assert.equal(formatMoney(Number.NaN), '—')
    assert.equal(formatMoney(10, null), 'S/ 10.00')
  })
  check('Totales por moneda: sin mezclar monedas, ignora vacíos, mayor monto primero', () => {
    const items = [
      { c: 'USD', a: 100 },
      { c: 'PEN', a: 50 },
      { c: 'USD', a: null },
      { c: '', a: 5 },
    ]
    assert.deepEqual(
      sumByCurrency(items, (i) => i.c, (i) => i.a),
      [
        { currency: 'USD', amount: 100 },
        { currency: 'PEN', amount: 55 },
      ],
    )
  })
  check('Resumen multi-moneda: cifra principal y el resto debajo', () => {
    assert.deepEqual(splitCurrencyTotals([]), { main: 'S/ 0.00', rest: '' })
    assert.deepEqual(
      splitCurrencyTotals([
        { currency: 'PEN', amount: 10 },
        { currency: 'USD', amount: 5 },
      ]),
      { main: 'S/ 10.00', rest: 'US$ 5.00' },
    )
    assert.deepEqual(splitCurrencyTotals([{ currency: 'EUR', amount: 1234.5 }], true), {
      main: '€ 1,235',
      rest: '',
    })
  })

  console.log(`Dinero: ${passed} pruebas OK`)
}
