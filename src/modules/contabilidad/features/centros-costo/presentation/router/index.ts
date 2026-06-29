import type { RouteRecordRaw } from 'vue-router'

export const contabilidadCentrosCostoRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'contabilidad-centros-costo',
    component: () => import('../views/ContabilidadCentrosCostoView.vue'),
    meta: { title: 'Centros de costo' },
  },
]
