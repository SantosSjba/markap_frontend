import type { RouteRecordRaw } from 'vue-router'

export const contabilidadInventarioContableRoutes: RouteRecordRaw[] = [
  { path: '', redirect: { name: 'contabilidad-inventario-items' } },
  {
    path: 'items',
    name: 'contabilidad-inventario-items',
    component: () => import('../views/ContabilidadInventarioItemsView.vue'),
    meta: { title: 'Ítems de inventario' },
  },
  {
    path: 'movimientos',
    name: 'contabilidad-inventario-movimientos',
    component: () => import('../views/ContabilidadInventarioMovimientosView.vue'),
    meta: { title: 'Movimientos' },
  },
  {
    path: 'kardex',
    name: 'contabilidad-inventario-kardex',
    component: () => import('../views/ContabilidadInventarioKardexView.vue'),
    meta: { title: 'Kardex' },
  },
  {
    path: 'valorizado',
    name: 'contabilidad-inventario-valorizado',
    component: () => import('../views/ContabilidadInventarioValorizadoView.vue'),
    meta: { title: 'Saldo valorizado' },
  },
]
