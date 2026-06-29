import type { RouteRecordRaw } from 'vue-router'

export const produccionConfiguracionRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'produccion-configuracion',
    component: () => import('../views/ProduccionConfiguracionView.vue'),
    meta: { title: 'Configuración' },
  },
]
