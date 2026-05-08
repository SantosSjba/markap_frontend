import type { RouteRecordRaw } from 'vue-router'

export const interiorismoEjecucionRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'interiorismo-ejecucion',
    component: () => import('../views/InteriorismoEjecucionHubView.vue'),
    meta: { title: 'Ejecución de obra' },
  },
  {
    path: ':projectId',
    name: 'interiorismo-ejecucion-tablero',
    component: () => import('../views/InteriorismoEjecucionTableroView.vue'),
    meta: { title: 'Tablero de ejecución' },
  },
]
