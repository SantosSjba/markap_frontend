import type { RouteRecordRaw } from 'vue-router'

export const interiorismoFinanzasRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'interiorismo-finanzas',
    component: () => import('../views/InteriorismoFinanzasHubView.vue'),
    meta: { title: 'Finanzas del proyecto' },
  },
  {
    path: ':projectId',
    name: 'interiorismo-finanzas-tablero',
    component: () => import('../views/InteriorismoFinanzasTableroView.vue'),
    meta: { title: 'Panel financiero' },
  },
]
