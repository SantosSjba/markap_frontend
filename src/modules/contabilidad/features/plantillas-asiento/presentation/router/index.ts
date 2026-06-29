import type { RouteRecordRaw } from 'vue-router'

export const contabilidadPlantillasAsientoRoutes: RouteRecordRaw[] = [
  {
    path: 'plantillas-asiento',
    name: 'contabilidad-plantillas-asiento',
    component: () => import('../views/ContabilidadPlantillasAsientoView.vue'),
    meta: { title: 'Plantillas de asiento' },
  },
]
