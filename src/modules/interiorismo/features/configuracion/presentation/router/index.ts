import type { RouteRecordRaw } from 'vue-router'

export const interiorismoConfiguracionRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'interiorismo-configuracion',
    component: () => import('../views/InteriorismoConfiguracionView.vue'),
    meta: { title: 'Configuración' },
  },
]
