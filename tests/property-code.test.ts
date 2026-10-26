import assert from 'node:assert/strict'
import {
  buildPropertyCode,
  propertyTypeCodeWord,
  suggestOwnerSurname,
} from '@modules/alquileres/features/propiedades/domain/property-code'

export async function run() {
  let passed = 0
  const check = (name: string, fn: () => void) => {
    fn()
    console.log(`PASS ${name}`)
    passed++
  }

  check('Código de propiedad: tipo + ubicación + apellido (sin operación ni año)', () => {
    assert.equal(
      buildPropertyCode({ typeName: 'Casa', location: 'El Bosque', ownerSurname: 'Jiménez' }),
      'CASA-EL BOSQUE-JIMÉNEZ',
    )
  })
  check('Tipo en una palabra y separador fuera de las partes', () => {
    assert.equal(propertyTypeCodeWord('Local comercial'), 'LOCAL')
    assert.equal(
      buildPropertyCode({ typeName: 'Departamento', location: ' San-Isidro ', ownerSurname: 'pérez' }),
      'DEPARTAMENTO-SAN ISIDRO-PÉREZ',
    )
  })
  check('Partes vacías se omiten mientras se llena el formulario', () => {
    assert.equal(buildPropertyCode({ typeName: 'Terreno' }), 'TERRENO')
  })
  check('Apellido del propietario para personas y empresas', () => {
    assert.equal(suggestOwnerSurname('FERNANDO SIXTELIO RODRIGUEZ PAREDES', '07938769'), 'RODRIGUEZ')
    assert.equal(suggestOwnerSurname('Ana Pérez', '12345678'), 'Pérez')
    assert.equal(suggestOwnerSurname('JRL INMOBILIARIA CONSTRUCTORA S.A.C', '20605964487'), 'JRL')
  })

  console.log(`${passed} pruebas de código de propiedad aprobadas.`)
}
