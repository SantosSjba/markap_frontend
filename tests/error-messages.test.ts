import assert from 'node:assert/strict'
import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
function httpError(status: number, data: unknown, code?: string) {
  const config = { headers: new AxiosHeaders() }
  const response = { status, data, statusText: '', headers: {}, config } as AxiosResponse
  return new AxiosError(`Request failed with status code ${status}`, code, config, null, response)
}

export async function run() {
  let passed = 0
  const check = (name: string, fn: () => void) => {
    fn()
    console.log(`PASS ${name}`)
    passed++
  }
  const technical =
    /internal server|status code|network error|prisma|cannot get|undefined|not found/i
  check('Error 500 no muestra texto técnico y remite a soporte', () => {
    const msg = getApiErrorMessage(
      httpError(500, { message: 'Internal server error' }),
      'No se pudo guardar el pago',
    )
    assert.match(msg, /^No se pudo guardar el pago\./)
    assert.match(msg, /soporte/)
    assert.doesNotMatch(msg, technical)
  })
  check('Sin conexión explica el problema y remite a soporte', () => {
    const msg = getApiErrorMessage(new AxiosError('Network Error', 'ERR_NETWORK'))
    assert.match(msg, /conectar con el servidor/)
    assert.match(msg, /soporte/)
  })
  check('Ruta inexistente o mensaje en inglés se sustituye', () => {
    assert.doesNotMatch(
      getApiErrorMessage(httpError(404, { message: 'Cannot GET /api/x' })),
      technical,
    )
    assert.doesNotMatch(
      getApiErrorMessage(httpError(400, { message: 'Journal entry not found' })),
      technical,
    )
    assert.doesNotMatch(
      getApiErrorMessage(httpError(400, { message: 'PROJECT_NOT_FOUND' })),
      /PROJECT_NOT_FOUND/,
    )
  })
  check('Mensajes de negocio del servidor se muestran tal cual', () => {
    assert.equal(
      getApiErrorMessage(httpError(400, { message: 'El cobro supera el saldo pendiente' })),
      'El cobro supera el saldo pendiente.',
    )
    assert.equal(
      getApiErrorMessage(
        httpError(400, {
          message: ['El campo «amount» debe ser un número válido.', 'property x should not exist'],
        }),
      ),
      'El campo «amount» debe ser un número válido.',
    )
  })
  check('Errores de JavaScript no llegan al usuario', () => {
    const msg = getApiErrorMessage(
      new TypeError("Cannot read properties of undefined (reading 'id')"),
      'No se pudo cargar',
    )
    assert.match(msg, /^No se pudo cargar\./)
    assert.doesNotMatch(msg, /undefined/)
  })
  console.log(`${passed} pruebas de mensajes de error aprobadas.`)
}
