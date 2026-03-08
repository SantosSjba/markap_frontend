import type { RouteRecordRaw } from 'vue-router'

export const configuracionRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'alquileres-configuracion',
    component: () => import('../views/ConfiguracionView.vue'),
    meta: { title: 'Configuración' },
  },
]
