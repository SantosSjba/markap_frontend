import type { RouteRecordRaw } from 'vue-router'

export const arquitecturaReportesRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'arquitectura-reportes',
    component: () => import('../views/ArquitecturaReportesView.vue'),
    meta: { title: 'Reportes' },
  },
]
