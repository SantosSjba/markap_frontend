import type { RouteRecordRaw } from 'vue-router'

export const produccionComprasRoutes: RouteRecordRaw[] = [
  {
    path: 'proveedores',
    name: 'produccion-compras-proveedores',
    component: () => import('../views/ProduccionProveedoresView.vue'),
    meta: { title: 'Proveedores' },
  },
  {
    path: 'proveedores/:id',
    name: 'produccion-compras-proveedor-detalle',
    component: () => import('../views/ProduccionProveedorDetalleView.vue'),
    meta: { title: 'Detalle proveedor' },
  },
  {
    path: 'ordenes-compra',
    name: 'produccion-compras-ordenes-compra',
    component: () => import('../views/ProduccionOrdenesCompraView.vue'),
    meta: { title: 'Órdenes de compra' },
  },
  {
    path: 'ordenes-compra/nueva',
    name: 'produccion-compras-orden-nueva',
    component: () => import('../views/ProduccionOrdenCompraNuevaView.vue'),
    meta: { title: 'Nueva orden de compra' },
  },
  {
    path: 'ordenes-compra/:id',
    name: 'produccion-compras-orden-detalle',
    component: () => import('../views/ProduccionOrdenCompraDetalleView.vue'),
    meta: { title: 'Detalle orden de compra' },
  },
]
