import { createServer, loadConfigFromFile } from 'vite'
import vue from '@vitejs/plugin-vue'
import fs from 'node:fs'
const loaded = await loadConfigFromFile({ command: 'serve', mode: 'test' })
const server = await createServer({ configFile: false, plugins: [vue(), {
  name: 'audit-memory-router', enforce: 'pre',
  transform(code, id) {
    if (id.endsWith('/src/router/index.ts')) return code.replaceAll('createWebHistory', 'createMemoryHistory')
  },
}], optimizeDeps: { noDiscovery: true, include: [] }, resolve: loaded.config.resolve, server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' })
const results = []
try {
  const { default: router } = await server.ssrLoadModule('/src/router/index.ts')
  for (const route of router.getRoutes()) {
    const record = { path: route.path, name: String(route.name || ''), redirect: Boolean(route.redirect), status: 'RESUELTA' }
    try {
      for (const component of Object.values(route.components || {})) {
        if (typeof component === 'function') await component()
      }
      record.status = 'COMPONENTES_CARGADOS'
    } catch (error) {
      record.status = 'ERROR_CARGA'; record.error = error.message
    }
    results.push(record)
  }
  fs.writeFileSync('../auditoria/resultados-rutas-componentes.json', JSON.stringify(results, null, 2))
  const failed = results.filter(r => r.status === 'ERROR_CARGA')
  console.log(JSON.stringify({ routes: results.length, loaded: results.length-failed.length, failed }, null, 2))
  if (failed.length) process.exitCode = 1
} finally { await server.close() }
