import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@core': fileURLToPath(new URL('./src/core', import.meta.url)),
      '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
      '@layouts': fileURLToPath(new URL('./src/shared/layouts', import.meta.url)),
      '@modules': fileURLToPath(new URL('./src/modules', import.meta.url)),
      '@ventas/sales': fileURLToPath(new URL('./src/modules/ventas/features/ventas-sales', import.meta.url)),
      '@ventas/finanzas': fileURLToPath(new URL('./src/modules/ventas/features/ventas-finanzas', import.meta.url)),
      '@ventas/reportes': fileURLToPath(new URL('./src/modules/ventas/features/ventas-reportes', import.meta.url)),
      '@ventas/configuracion': fileURLToPath(
        new URL('./src/modules/ventas/features/ventas-configuracion', import.meta.url),
      ),
    },
  },
})
