import type { RouteRecordRaw } from 'vue-router'
export const comisionesRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'alquileres-comisiones',
    component: () => import('../views/ComisionesView.vue'),
    meta: { title: 'Comisiones' },
  },
]
