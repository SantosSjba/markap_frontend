import type { RouteRecordRaw } from 'vue-router'

/**
 * Rutas del módulo Clientes (se montan como children de /alquileres/clientes)
 */
export const clientesRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'alquileres-clientes',
    component: () => import('../views/ClientesView.vue'),
    meta: { title: 'Clientes' },
  },
  {
    path: ':id/editar',
    name: 'alquileres-clientes-editar',
    component: () => import('../views/EditarClienteView.vue'),
    meta: { title: 'Editar Cliente' },
  },
  {
    path: 'nuevo',
    name: 'alquileres-clientes-nuevo',
    component: () => import('../views/NuevoClienteView.vue'),
    meta: { title: 'Nuevo Cliente' },
  },
]
