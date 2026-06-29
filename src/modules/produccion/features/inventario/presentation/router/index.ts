import type { RouteRecordRaw } from 'vue-router'

export const produccionInventarioRoutes: RouteRecordRaw[] = [
  {
    path: 'materiales',
    name: 'produccion-inventario-materiales',
    component: () => import('../views/ProduccionMaterialesView.vue'),
    meta: { title: 'Materiales' },
  },
  {
    path: 'stock',
    name: 'produccion-inventario-stock',
    component: () => import('../views/ProduccionStockView.vue'),
    meta: { title: 'Stock' },
  },
  {
    path: 'movimientos',
    name: 'produccion-inventario-movimientos',
    component: () => import('../views/ProduccionMovimientosView.vue'),
    meta: { title: 'Movimientos' },
  },
]
