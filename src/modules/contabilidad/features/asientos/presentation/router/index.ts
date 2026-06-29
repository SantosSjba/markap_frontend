import type { RouteRecordRaw } from 'vue-router'

export const contabilidadAsientosRoutes: RouteRecordRaw[] = [
  {
    path: '',
    redirect: { name: 'contabilidad-asientos-libro-diario' },
  },
  {
    path: 'libro-diario',
    name: 'contabilidad-asientos-libro-diario',
    component: () => import('../views/ContabilidadLibroDiarioView.vue'),
    meta: { title: 'Libro diario' },
  },
  {
    path: 'nuevo',
    name: 'contabilidad-asientos-nuevo',
    component: () => import('../views/ContabilidadAsientoFormView.vue'),
    meta: { title: 'Nuevo asiento' },
  },
  {
    path: ':id/editar',
    name: 'contabilidad-asiento-editar',
    component: () => import('../views/ContabilidadAsientoFormView.vue'),
    meta: { title: 'Editar asiento' },
  },
  {
    path: ':id',
    name: 'contabilidad-asiento-detalle',
    component: () => import('../views/ContabilidadAsientoDetalleView.vue'),
    meta: { title: 'Detalle de asiento' },
  },
]
