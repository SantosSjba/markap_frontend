import type { RouteRecordRaw } from 'vue-router'

export const produccionVentasRoutes: RouteRecordRaw[] = [
  {
    path: 'cotizaciones',
    name: 'produccion-ventas-cotizaciones',
    component: () => import('../views/ProduccionCotizacionesView.vue'),
    meta: { title: 'Cotizaciones' },
  },
  {
    path: 'cotizaciones/nueva',
    name: 'produccion-ventas-cotizacion-nueva',
    component: () => import('../views/ProduccionCotizacionNuevaView.vue'),
    meta: { title: 'Nueva cotización' },
  },
  {
    path: 'cotizaciones/:id',
    name: 'produccion-ventas-cotizacion-detalle',
    component: () => import('../views/ProduccionCotizacionDetalleView.vue'),
    meta: { title: 'Detalle cotización' },
  },
  {
    path: 'pedidos',
    name: 'produccion-ventas-pedidos',
    component: () => import('../views/ProduccionPedidosView.vue'),
    meta: { title: 'Pedidos' },
  },
  {
    path: 'pedidos/:id',
    name: 'produccion-ventas-pedido-detalle',
    component: () => import('../views/ProduccionPedidoDetalleView.vue'),
    meta: { title: 'Detalle pedido' },
  },
  {
    path: 'entregas',
    name: 'produccion-ventas-entregas',
    component: () => import('../views/ProduccionEntregasView.vue'),
    meta: { title: 'Entregas' },
  },
  {
    path: 'entregas/:id',
    name: 'produccion-ventas-entrega-detalle',
    component: () => import('../views/ProduccionEntregaDetalleView.vue'),
    meta: { title: 'Detalle entrega' },
  },
]
