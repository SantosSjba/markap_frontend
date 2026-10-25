import { apiServerUrl, envConfig } from '@shared/config/env.config'
import { resolveFileDownloadUrl } from '@shared/utils/archivo-url'
import assert from 'node:assert/strict'
import { createApp } from 'vue'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { AxiosError, AxiosHeaders } from 'axios'
import { installServices } from '@app/providers/services'
import { createServiceKey } from '@shared/application/ports/service-key'
import { FILE_ACCESS } from '@shared/application/ports/file-access.port'
import { DIRECTORY } from '@shared/application/ports/directory.port'
import { provideService, useService } from '@shared/presentation/di/services'
import { apiClient, configureHttpSession } from '@shared/infrastructure/http/api-client'
import { produccionSalesRepositoryKey } from '@modules/produccion/features/ventas/application/ports/sales.port'
import { useOpenProduccionQuotationPdf } from '@modules/produccion/features/ventas/presentation/composables/useProduccionSales'
export async function run() {
  const app = createApp({})
  installServices(app)
  let providers = 0
  for (const load of Object.values(import.meta.glob('../src/**/application/ports/*.port.ts'))) {
    const module = (await load()) as Record<string, unknown>
    for (const value of Object.values(module)) {
      if (
        value &&
        typeof value === 'object' &&
        'token' in value &&
        typeof value.token === 'symbol'
      ) {
        assert.ok(
          app.runWithContext(() => useService(value as ReturnType<typeof createServiceKey>)),
        )
        providers++
      }
    }
  }
  assert.ok(providers >= 70)
  console.log(`PASS ${providers} puertos tienen un proveedor registrado`)

  const key = createServiceKey<{ name: string }>('test.isolation')
  const other = createApp({})
  provideService(app, key, { name: 'one' })
  provideService(other, key, { name: 'two' })
  assert.equal(app.runWithContext(() => useService(key)).name, 'one')
  assert.equal(other.runWithContext(() => useService(key)).name, 'two')
  assert.throws(
    () => app.runWithContext(() => useService(createServiceKey('missing'))),
    /Servicio no registrado/,
  )
  console.log('PASS Proveedores aislados por aplicación y dependencias faltantes detectadas')

  assert.equal(apiClient.defaults.baseURL, envConfig.apiBaseUrl)
  assert.equal(
    resolveFileDownloadUrl({ filePath: 'uploads/contracts/a.pdf' }),
    `${apiServerUrl}/uploads/contracts/a.pdf`,
  )
  console.log('PASS API, sockets y archivos legacy comparten configuración de servidor')

  const originalAdapter = apiClient.defaults.adapter
  const requests: Array<{ url?: string; params: unknown; token: unknown }> = []
  const dispose = configureHttpSession({
    getAccessToken: () => 'session-test',
    onUnauthorized: () => {},
  })
  apiClient.defaults.adapter = async (config) => {
    requests.push({ url: config.url, params: config.params, token: config.headers.Authorization })
    return {
      data: config.url === '/agents' ? { data: [] } : { url: 'https://files.example/test' },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    }
  }
  try {
    const files = app.runWithContext(() => useService(FILE_ACCESS))
    await files.resolveDownloadUrl('files/a.pdf', { applicationSlug: 'ventas' })
    await files.getDownloadUrl('id', { applicationSlug: 'alquileres', expiresIn: 60 })
    await app
      .runWithContext(() => useService(DIRECTORY))
      .listAgents({ applicationSlug: 'arquitectura', limit: 100 })
    assert.deepEqual(requests[0]?.params, { objectKey: 'files/a.pdf', applicationSlug: 'ventas' })
    assert.deepEqual(requests[1]?.params, { applicationSlug: 'alquileres', expiresIn: 60 })
    assert.deepEqual(requests[2]?.params, { applicationSlug: 'arquitectura', limit: 100 })
    assert.ok(requests.every((request) => request.token === 'Bearer session-test'))
    console.log('PASS Adaptadores conservan ámbito de aplicación, expiración y token HTTP')

    let unauthorized = 0
    const newerDispose = configureHttpSession({
      getAccessToken: () => null,
      onUnauthorized: () => {
        unauthorized++
      },
    })
    dispose()
    apiClient.defaults.adapter = async (config) => {
      throw new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, null, {
        config,
        data: {},
        headers: new AxiosHeaders(),
        status: 401,
        statusText: 'Unauthorized',
      })
    }
    await assert.rejects(apiClient.get('/test'))
    assert.equal(unauthorized, 1, 'Desmontar una sesión anterior no debe eliminar la sesión actual')
    newerDispose()
    console.log('PASS HTTP 401 delega la sesión sin importar stores ni navegar desde el transporte')
  } finally {
    dispose()
    apiClient.defaults.adapter = originalAdapter
  }

  const fake = app.runWithContext(() => useService(produccionSalesRepositoryKey))
  const download = { ...fake, fetchQuotationPdfHtml: async () => '<html>test</html>' }
  // Capture the dependency at setup; invoking the action later needs no Vue injection context.
  const originalInfo = markapAlert.toast.info
  markapAlert.toast.info = async () => ({ isConfirmed: false, isDenied: false, isDismissed: true })
  const originalWindow = globalThis.window
  const originalCreate = URL.createObjectURL
  const originalRevoke = URL.revokeObjectURL
  let opened = false
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      open: () => {
        opened = true
      },
      setTimeout: () => 0,
    },
  })
  URL.createObjectURL = () => 'blob:test'
  URL.revokeObjectURL = () => {}
  const downloadApp = createApp({})
  provideService(downloadApp, produccionSalesRepositoryKey, download)
  const open = downloadApp.runWithContext(() => useOpenProduccionQuotationPdf())
  try {
    await open('quotation')
    assert.equal(opened, true)
  } finally {
    Object.defineProperty(globalThis, 'window', { configurable: true, value: originalWindow })
    URL.createObjectURL = originalCreate
    URL.revokeObjectURL = originalRevoke
    markapAlert.toast.info = originalInfo
  }
  console.log('PASS Acciones diferidas capturan servicios durante setup')
}
