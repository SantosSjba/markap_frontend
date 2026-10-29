import { createServer, loadConfigFromFile } from 'vite'
import vue from '@vitejs/plugin-vue'
const loaded = await loadConfigFromFile({ command: 'serve', mode: 'test' })
const server = await createServer({ configFile: false, plugins: [vue()], optimizeDeps: { noDiscovery: true, include: [] }, resolve: loaded.config.resolve, server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' })
try {
  for (const file of ['/tests/application-access.test.ts', '/tests/synchronization.test.ts', '/tests/error-messages.test.ts', '/tests/property-code.test.ts', '/tests/money.test.ts', '/tests/project-code.test.ts', '/tests/budget-sheet.test.ts', '/tests/budget-catalog.test.ts', '/tests/calendar-grid.test.ts', '/tests/architecture.test.ts', '/tests/routes.test.ts']) {
    const { run } = await server.ssrLoadModule(file)
    await run()
  }
} finally {
  await server.close()
}
