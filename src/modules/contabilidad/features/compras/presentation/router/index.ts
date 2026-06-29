import type { RouteRecordRaw } from 'vue-router'

export const contabilidadComprasRoutes: RouteRecordRaw[] = [
  {
    path: '',
    redirect: { name: 'contabilidad-compras-facturas' },
  },
  {
    path: 'facturas',
    name: 'contabilidad-compras-facturas',
    component: () => import('../views/ContabilidadComprasFacturasView.vue'),
    meta: { title: 'Facturas de compra' },
  },
  {
    path: 'notas-credito',
    name: 'contabilidad-compras-notas-credito',
    component: () => import('../views/ContabilidadComprasNotasCreditoView.vue'),
    meta: { title: 'Notas de crédito' },
  },
  {
    path: 'proveedores',
    name: 'contabilidad-compras-proveedores',
    component: () => import('../views/ContabilidadComprasProveedoresView.vue'),
    meta: { title: 'Proveedores' },
  },
  {
    path: 'pagos',
    name: 'contabilidad-compras-pagos',
    component: () => import('../views/ContabilidadComprasPagosView.vue'),
    meta: { title: 'Pagos' },
  },
  {
    path: 'registrar',
    redirect: '/contabilidad/compras/facturas',
  },
]
