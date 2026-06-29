import type { RouteRecordRaw } from 'vue-router'

export const produccionCostosRoutes: RouteRecordRaw[] = [
  {
    path: 'costeo',
    name: 'produccion-costos-costeo',
    component: () => import('../views/ProduccionCosteoView.vue'),
    meta: { title: 'Costeo de muebles' },
  },
  {
    path: 'mano-obra',
    name: 'produccion-costos-mano-obra',
    component: () => import('../views/ProduccionManoObraView.vue'),
    meta: { title: 'Mano de obra' },
  },
  {
    path: 'gastos',
    name: 'produccion-costos-gastos',
    component: () => import('../views/ProduccionGastosView.vue'),
    meta: { title: 'Gastos adicionales' },
  },
]
