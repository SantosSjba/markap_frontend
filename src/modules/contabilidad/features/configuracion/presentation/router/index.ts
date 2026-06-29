import type { RouteRecordRaw } from 'vue-router'

export const contabilidadConfiguracionRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'contabilidad-configuracion',
    component: () => import('../views/ContabilidadConfiguracionView.vue'),
    meta: { title: 'Configuración' },
  },
]
