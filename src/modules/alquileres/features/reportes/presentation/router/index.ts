import type { RouteRecordRaw } from 'vue-router'

export const alquileresReportesRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'alquileres-reportes',
    component: () => import('../views/ReportesView.vue'),
    meta: { title: 'Reportes' },
  },
]
