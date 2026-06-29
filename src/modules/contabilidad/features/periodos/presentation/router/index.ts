import type { RouteRecordRaw } from 'vue-router'

export const contabilidadPeriodosRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'contabilidad-periodos',
    component: () => import('../views/ContabilidadPeriodosView.vue'),
    meta: { title: 'Periodos contables' },
  },
]
