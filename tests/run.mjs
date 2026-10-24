import { createServer, loadConfigFromFile } from 'vite'
import vue from '@vitejs/plugin-vue'
const loaded = await loadConfigFromFile({ command: 'serve', mode: 'test' })
const server = await createServer({ configFile: false, plugins: [vue()], optimizeDeps: { noDiscovery: true, include: [] }, resolve: loaded.config.resolve, server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' })
try {
  const { run } = await server.ssrLoadModule('/tests/synchronization.test.ts')
  await run()
} finally {
  await server.close()
}
