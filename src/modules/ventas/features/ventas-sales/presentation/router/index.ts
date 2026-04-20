import type { RouteRecordRaw } from 'vue-router'

export const ventasSalesProcesosRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'ventas-procesos',
    component: () => import('../views/VentasProcesosView.vue'),
    meta: { title: 'Procesos de Venta' },
  },
  {
    path: 'pipeline',
    name: 'ventas-procesos-pipeline',
    component: () => import('../views/VentasPipelineView.vue'),
    meta: { title: 'Pipeline de ventas' },
  },
  {
    path: ':id',
    name: 'ventas-proceso-detalle',
    component: () => import('../views/VentasProcesoDetalleView.vue'),
    meta: { title: 'Detalle proceso' },
  },
]

export const ventasSalesSeparacionesRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'ventas-separaciones',
    component: () => import('../views/VentasSeparacionesView.vue'),
    meta: { title: 'Separaciones' },
  },
]

export const ventasSalesCierresRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'ventas-cierres',
    component: () => import('../views/VentasCierresView.vue'),
    meta: { title: 'Cierres' },
  },
]
