import type { RouteRecordRaw } from 'vue-router'

export const ventasReportesRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'ventas-reportes',
    component: () => import('../views/VentasReportesView.vue'),
    meta: { title: 'Reportes' },
  },
]
