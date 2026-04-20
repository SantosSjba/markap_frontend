import type { RouteRecordRaw } from 'vue-router'

export const cobranzasRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'alquileres-cobranzas',
    component: () => import('../views/CobranzasPendientesView.vue'),
    meta: { title: 'Pagos Pendientes' },
  },
  {
    path: 'historial',
    name: 'alquileres-cobranzas-historial',
    component: () => import('../views/CobranzasHistorialView.vue'),
    meta: { title: 'Historial de Pagos' },
  },
  {
    path: 'atrasos',
    name: 'alquileres-cobranzas-atrasos',
    component: () => import('../views/CobranzasAtrasosView.vue'),
    meta: { title: 'Con Atraso' },
  },
]
