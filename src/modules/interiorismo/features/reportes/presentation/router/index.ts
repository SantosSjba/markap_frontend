import type { RouteRecordRaw } from 'vue-router'

export const interiorismoReportesRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'interiorismo-reportes',
    component: () => import('../views/InteriorismoReportesView.vue'),
    meta: { title: 'Reportes' },
  },
]
