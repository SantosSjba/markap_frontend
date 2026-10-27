import type { RouteRecordRaw } from 'vue-router'
export const ventasSalesProcesosRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'ventas-procesos',
    component: () => import('../views/VentasProcesosView.vue'),
    meta: { title: 'Procesos de Venta' },
  },
  {
    path: 'nuevo',
    name: 'ventas-procesos-nuevo',
    component: () => import('../views/VentasNuevoProcesoView.vue'),
    meta: { title: 'Nuevo proceso de venta' },
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
  // Checklist legal del proceso (se completa antes de registrar el cierre)
  {
    path: ':id/cumplimiento',
    name: 'ventas-proceso-cumplimiento',
    component: () => import('../views/VentasCierreCumplimientoView.vue'),
    meta: { title: 'Cumplimiento legal' },
  },
]

// Separaciones y cierres se registran y consultan desde la ficha del proceso de venta;
// las direcciones antiguas llevan al listado de procesos.
export const ventasSalesSeparacionesRoutes: RouteRecordRaw[] = [
  { path: '', redirect: { name: 'ventas-procesos' } },
]

export const ventasSalesCierresRoutes: RouteRecordRaw[] = [
  { path: '', redirect: { name: 'ventas-procesos' } },
  {
    path: ':closingId/cumplimiento',
    name: 'ventas-cierre-cumplimiento',
    component: () => import('../views/VentasCierreCumplimientoView.vue'),
    meta: { title: 'Cumplimiento legal del cierre' },
  },
]
