import type { RouteRecordRaw } from 'vue-router'

export const arquitecturaConfiguracionRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'arquitectura-configuracion',
    component: () => import('../views/ArquitecturaConfiguracionView.vue'),
    meta: { title: 'Configuración' },
  },
]
