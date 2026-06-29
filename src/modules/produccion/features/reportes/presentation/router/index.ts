import type { RouteRecordRaw } from 'vue-router'

export const produccionReportesRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'produccion-reportes',
    component: () => import('../views/ProduccionReportesView.vue'),
    meta: { title: 'Reportes' },
  },
]
