import type { RouteRecordRaw } from 'vue-router'

export const ventasClientesRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'ventas-clientes',
    component: () => import('../views/VentasClientesView.vue'),
    meta: { title: 'Listado de Clientes' },
  },
  {
    path: 'propietarios',
    name: 'ventas-clientes-propietarios',
    component: () => import('../views/VentasClientesView.vue'),
    meta: { title: 'Propietarios' },
  },
  {
    path: 'nuevo',
    name: 'ventas-clientes-nuevo',
    component: () => import('../views/VentasNuevoClienteView.vue'),
    meta: { title: 'Nuevo Cliente' },
  },
  {
    path: ':id/editar',
    name: 'ventas-clientes-editar',
    component: () => import('../views/VentasEditarClienteView.vue'),
    meta: { title: 'Editar Cliente' },
  },
]
