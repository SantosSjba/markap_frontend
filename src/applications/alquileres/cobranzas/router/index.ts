import type { RouteRecordRaw } from 'vue-router'

export const cobranzasRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'alquileres-cobranzas',
    component: () =>
      import('@applications/alquileres/cobranzas/views/CobranzasPendientesView.vue'),
    meta: { title: 'Pagos Pendientes' },
  },
  {
    path: 'historial',
    name: 'alquileres-cobranzas-historial',
    component: () =>
      import('@applications/alquileres/cobranzas/views/CobranzasHistorialView.vue'),
    meta: { title: 'Historial de Pagos' },
  },
  {
    path: 'atrasos',
    name: 'alquileres-cobranzas-atrasos',
    component: () =>
      import('@applications/alquileres/cobranzas/views/CobranzasAtrasosView.vue'),
    meta: { title: 'Con Atraso' },
  },
]
