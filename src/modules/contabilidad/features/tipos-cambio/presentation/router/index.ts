import type { RouteRecordRaw } from 'vue-router'

export const contabilidadTiposCambioRoutes: RouteRecordRaw[] = [
  {
    path: 'tipos-cambio',
    name: 'contabilidad-tipos-cambio',
    component: () => import('../views/ContabilidadTiposCambioView.vue'),
    meta: { title: 'Tipos de cambio' },
  },
]
