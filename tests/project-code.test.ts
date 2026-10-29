import assert from 'node:assert/strict'
import {
  buildInteriorProjectCode,
  suggestClientSurname,
} from '@modules/interiorismo/features/proyectos/domain/project-code'

export async function run() {
  let passed = 0
  const check = (name: string, fn: () => void) => {
    fn()
    console.log(`PASS ${name}`)
    passed++
  }

  check('Código de proyecto: operación + año + tipo + distrito + apellido', () => {
    assert.equal(
      buildInteriorProjectCode({ year: 2026, typeLabel: 'Diseño interior', district: 'Cayma', clientSurname: 'Torres' }),
      'PROYECTO-2026-DISEÑO-CAYMA-TORRES',
    )
  })
  check('Partes normalizadas: mayúsculas, sin separador ni espacios dobles', () => {
    assert.equal(
      buildInteriorProjectCode({ year: 2026, typeLabel: 'Remodelación', district: ' San-Isidro ', clientSurname: 'pérez' }),
      'PROYECTO-2026-REMODELACIÓN-SAN ISIDRO-PÉREZ',
    )
  })
  check('Partes vacías se omiten mientras se llena el formulario', () => {
    assert.equal(buildInteriorProjectCode({ year: 2026 }), 'PROYECTO-2026')
    assert.equal(buildInteriorProjectCode({ year: 2026, clientSurname: 'Vega' }), 'PROYECTO-2026-VEGA')
  })
  check('Apellido del cliente: paterno en personas, primera palabra en empresas', () => {
    assert.equal(suggestClientSurname('Ana María Torres Vega'), 'Torres')
    assert.equal(suggestClientSurname('Constructora Andina SAC', '20123456789'), 'Constructora')
    assert.equal(suggestClientSurname('Prize'), 'Prize')
  })

  console.log(`Código de proyecto: ${passed} pruebas OK`)
}
