import type { RouteRecordRaw } from 'vue-router'

export const contabilidadCpeLogRoutes: RouteRecordRaw[] = [
  {
    path: 'cpe-log',
    name: 'contabilidad-cpe-log',
    component: () => import('../views/ContabilidadCpeLogView.vue'),
    meta: { title: 'Trazabilidad CPE' },
  },
]
