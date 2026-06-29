import type { RouteRecordRaw } from 'vue-router'

export const produccionTallerRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'produccion-ordenes-trabajo',
    component: () => import('../views/ProduccionOrdenesTrabajoView.vue'),
    meta: { title: 'Órdenes de trabajo' },
  },
  {
    path: 'nueva',
    name: 'produccion-ot-nueva',
    component: () => import('../views/ProduccionOrdenTrabajoNuevaView.vue'),
    meta: { title: 'Nueva OT' },
  },
  {
    path: ':id',
    name: 'produccion-ot-detalle',
    component: () => import('../views/ProduccionOrdenTrabajoDetalleView.vue'),
    meta: { title: 'Detalle OT' },
  },
]

export const produccionSeguimientoRoutes: RouteRecordRaw[] = [
  {
    path: 'en-proceso',
    name: 'produccion-en-proceso',
    component: () => import('../views/ProduccionEnProcesoView.vue'),
    meta: { title: 'Producción en proceso' },
  },
  {
    path: 'etapas',
    name: 'produccion-etapas',
    component: () => import('../views/ProduccionEtapasView.vue'),
    meta: { title: 'Etapas de producción' },
  },
  {
    path: 'terminados',
    name: 'produccion-terminados',
    component: () => import('../views/ProduccionTerminadosView.vue'),
    meta: { title: 'Productos terminados' },
  },
]
