import assert from 'node:assert/strict'
import {
  catalogBudgetRow,
  catalogReferencePrice,
} from '@modules/interiorismo/features/proyecto-presupuesto/domain/catalog-budget-row'

export async function run() {
  const reference = {
    name: 'Chimenea',
    unit: 'und',
    price: 100,
    currency: 'PEN',
  }
  assert.equal(catalogReferencePrice(reference, 'PEN'), 100)
  assert.equal(catalogReferencePrice(reference, 'USD'), null)
  assert.equal(
    catalogReferencePrice({ currency: 'PEN', price: NaN }, 'PEN'),
    null,
  )
  const row = catalogBudgetRow({
    description: reference.name,
    unit: reference.unit,
    quantity: 2,
    unitPrice: reference.price,
  })
  assert.equal(row.directCost, null)
  assert.equal(row.quantity, 2)
  assert.equal(row.unitPrice, 100)
  assert.equal(row.actualCost, undefined)
  assert.equal(row.status, 'PENDING')
  assert.equal(row.supplierId, null)
  reference.price = 200
  reference.name = 'Nuevo nombre'
  assert.equal(row.unitPrice, 100)
  assert.equal(row.description, 'Chimenea')
  assert.equal(
    catalogBudgetRow({
      description: 'Instalación',
      unit: 'glb',
      quantity: 1,
      unitPrice: 0,
      supplierId: 'contractor',
    }).supplierId,
    'contractor',
  )
  for (const values of [
    { quantity: 0, unitPrice: 10 },
    { quantity: -1, unitPrice: 10 },
    { quantity: 1, unitPrice: -10 },
    { quantity: Infinity, unitPrice: 10 },
    { quantity: 1, unitPrice: NaN },
  ]) {
    assert.throws(() =>
      catalogBudgetRow({ description: 'Partida', unit: 'und', ...values }),
    )
  }
  console.log(
    'PASS Catálogo → presupuesto: moneda explícita, copia independiente, proveedor opcional y costo estimado sin registrar compra',
  )
}
