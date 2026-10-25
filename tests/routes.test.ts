import assert from 'node:assert/strict'
import { createMemoryHistory } from 'vue-router'
import { createAppRouter } from '@app/router/index'
import contract from './contracts/routes.json'
export async function run() {
  const router = createAppRouter(createMemoryHistory())
  const routes = router.getRoutes()
  const normalized = routes
    .map((route) => ({
      path: route.path,
      name: String(route.name ?? ''),
      meta: route.meta,
      redirect:
        typeof route.redirect === 'function' ? route.redirect.toString() : (route.redirect ?? null),
    }))
    .sort((a, b) => a.path.localeCompare(b.path) || a.name.localeCompare(b.name))
  assert.deepEqual(
    normalized,
    contract,
    'La reorganización debe conservar paths, nombres, redirects y metadatos',
  )
  let loaded = 0
  const components = new Set(routes.flatMap((route) => Object.values(route.components ?? {})))
  for (const component of components) {
    if (typeof component === 'function') {
      assert.ok(await (component as () => Promise<unknown>)(), 'El componente diferido debe cargar')
      loaded++
    }
  }
  console.log(
    `PASS ${routes.length} rutas conservan su contrato; ${loaded} componentes diferidos cargan`,
  )
}
