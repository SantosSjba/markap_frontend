import assert from 'node:assert/strict'
import { createApp, effectScope } from 'vue'
import { createPinia } from 'pinia'
import { QueryClient, QueryObserver, VueQueryPlugin } from '@tanstack/vue-query'
import { invalidateModuleQueries } from '../src/shared/utils/invalidateModuleQueries'
import { queryClient } from '../src/core/plugins/vue-query'
import { useAuthStore } from '../src/modules/auth/application/stores/auth.store'
import { useOrderMutations } from '../src/modules/produccion/features/ventas/application/useProduccionSales'
import { useContabilidadPostJournal } from '../src/modules/contabilidad/features/asientos/application/useContabilidadJournal'
import { useCreateExecutionTask } from '../src/modules/interiorismo/features/ejecucion/application/useInteriorExecution'
import { useNotificationsStore } from '../src/shared/notifications/application/notifications.store'
import { apiClient } from '../src/core/api/apiClient'
import { markapAlert } from '../src/shared/composables/useMarkapAlert'

export async function run() {
  let passed = 0
  const check = async (name: string, fn: () => void | Promise<void>) => {
    await fn()
    console.log(`PASS ${name}`)
    passed++
  }
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } })
  await check('Una mutación invalida todos los listados dependientes y conserva otros módulos', async () => {
    for (const key of ['produccion-sales', 'produccion-work-orders', 'produccion-inventory', 'produccion-reportes', 'ventas-sales']) qc.setQueryData([key], 'antes')
    await invalidateModuleQueries(qc, 'produccion')
    for (const key of ['produccion-sales', 'produccion-work-orders', 'produccion-inventory', 'produccion-reportes']) assert.equal(qc.getQueryState([key])?.isInvalidated, true)
    assert.equal(qc.getQueryState(['ventas-sales'])?.isInvalidated, false)
  })
  await check('Refresca datos activos y evita consultar listas inactivas hasta abrirlas', async () => {
    let version = 1
    const active = ['produccion-work-orders', 'list']
    const observer = new QueryObserver(qc, { queryKey: active, queryFn: async () => version })
    const unsubscribe = observer.subscribe(() => {})
    await observer.refetch()
    assert.equal(qc.getQueryData(active), 1)
    version = 2
    await invalidateModuleQueries(qc, 'produccion')
    assert.equal(qc.getQueryData(active), 2)
    const inactive = new QueryObserver(qc, { queryKey: ['produccion-reportes'], queryFn: async () => 'actualizado' })
    const stop = inactive.subscribe(() => {})
    await inactive.refetch()
    assert.equal(qc.getQueryData(['produccion-reportes']), 'actualizado')
    stop(); unsubscribe()
  })
  const app = createApp({})
  app.use(createPinia())
  app.use(VueQueryPlugin, { queryClient: qc })
  const scope = effectScope()
  const hooks = app.runWithContext(() => scope.run(() => ({ order: useOrderMutations(), post: useContabilidadPostJournal(), task: useCreateExecutionTask('proyecto-audit'), notifications: useNotificationsStore(), auth: useAuthStore() })))!
  const originalAdapter = apiClient.defaults.adapter
  const originalToast = markapAlert.toast.success
  markapAlert.toast.success = async () => undefined
  apiClient.defaults.adapter = async config => ({ data: { id: 'audit' }, status: 200, statusText: 'OK', headers: {}, config })
  try {
    await check('Crear OT desde pedido invalida el Taller y Reportes mediante el hook real', async () => {
      qc.setQueryData(['produccion-work-orders'], [])
      qc.setQueryData(['produccion-reportes'], {})
      await hooks.order.createWorkOrder.mutateAsync('pedido-audit')
      assert.equal(qc.getQueryState(['produccion-work-orders'])?.isInvalidated, true)
      assert.equal(qc.getQueryState(['produccion-reportes'])?.isInvalidated, true)
    })
    await check('Publicar asiento invalida estados financieros y tesorería mediante el hook real', async () => {
      qc.setQueryData(['contabilidad-financial'], {})
      qc.setQueryData(['contabilidad-treasury'], {})
      await hooks.post.mutateAsync('asiento-audit')
      assert.equal(qc.getQueryState(['contabilidad-financial'])?.isInvalidated, true)
      assert.equal(qc.getQueryState(['contabilidad-treasury'])?.isInvalidated, true)
    })
    await check('Cambiar ejecución de Interiorismo invalida reportes y calendario del módulo', async () => {
      qc.setQueryData(['interiorismo-reportes'], {})
      qc.setQueryData(['interiorismo-calendar', 'interiorismo'], {})
      await hooks.task.mutateAsync({ title: 'Tarea auditoría', phase: 'DESIGN' } as never)
      assert.equal(qc.getQueryState(['interiorismo-reportes'])?.isInvalidated, true)
      assert.equal(qc.getQueryState(['interiorismo-calendar', 'interiorismo'])?.isInvalidated, true)
    })
    await check('Clientes conservan su aplicación y actualizan sus dependencias', async () => {
      qc.setQueryData(['clients', 'produccion'], [])
      qc.setQueryData(['clients', 'interiorismo'], [])
      await invalidateModuleQueries(qc, 'produccion')
      assert.equal(qc.getQueryState(['clients', 'produccion'])?.isInvalidated, true)
      assert.equal(qc.getQueryState(['clients', 'interiorismo'])?.isInvalidated, false)
    })
    await check('Notificaciones repetidas y lectura repetida conservan el contador', async () => {
      const payload = { id: 'aviso-audit', title: 'Prueba', type: 'TEST', createdAt: new Date().toISOString() }
      hooks.notifications.pushFromSocket(payload)
      hooks.notifications.pushFromSocket(payload)
      assert.equal(hooks.notifications.total, 1)
      assert.equal(hooks.notifications.unreadCount, 1)
      hooks.notifications.pushFromSocket({ ...payload, id: 'segundo-aviso-audit' })
      await hooks.notifications.markAsRead(payload.id)
      await hooks.notifications.markAsRead(payload.id)
      assert.equal(hooks.notifications.unreadCount, 1)
    })
    await check('Salir elimina datos de la sesión anterior de la caché', () => {
      const storage = new Map<string, string>()
      Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (k: string) => storage.get(k) ?? null, setItem: (k: string, v: string) => storage.set(k, v), removeItem: (k: string) => storage.delete(k) } })
      queryClient.setQueryData(['applications', 'myApps'], ['dato privado'])
      hooks.auth.clearAuth()
      assert.equal(queryClient.getQueryCache().getAll().length, 0)
      assert.equal(hooks.auth.isAuthenticated, false)
    })
  } finally {
    apiClient.defaults.adapter = originalAdapter
    markapAlert.toast.success = originalToast
    scope.stop(); qc.clear(); queryClient.clear()
  }
  console.log(`${passed} pruebas de regresión aprobadas. Transporte HTTP simulado; no sustituye pruebas contra PostgreSQL.`)
}
