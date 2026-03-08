import type { RouteRecordRaw } from 'vue-router'

export const configuracionRoutes: RouteRecordRaw[] = [
  {
    path: 'configuracion',
    name: 'alquileres-configuracion',
    component: () =>
      import('../views/ConfiguracionView.vue'),
    meta: { title: 'Configuración' },
  },
]
