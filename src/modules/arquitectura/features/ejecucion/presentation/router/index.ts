import type { RouteRecordRaw } from 'vue-router'

export const arquitecturaEjecucionRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'arquitectura-ejecucion',
    component: () => import('../views/ArquitecturaEjecucionHubView.vue'),
    meta: { title: 'Ejecución de obra' },
  },
  {
    path: ':projectId',
    name: 'arquitectura-ejecucion-tablero',
    component: () => import('../views/ArquitecturaEjecucionTableroView.vue'),
    meta: { title: 'Tablero de ejecución' },
  },
]
