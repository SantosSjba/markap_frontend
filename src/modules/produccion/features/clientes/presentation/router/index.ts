import type { RouteRecordRaw } from 'vue-router'

export const produccionClientesRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'produccion-clientes',
    component: () => import('../views/ProduccionClientesView.vue'),
    meta: { title: 'Clientes' },
  },
  {
    path: 'nuevo',
    name: 'produccion-clientes-nuevo',
    component: () => import('../views/ProduccionNuevoClienteView.vue'),
    meta: { title: 'Nuevo cliente' },
  },
  {
    path: ':id/editar',
    name: 'produccion-clientes-editar',
    component: () => import('../views/ProduccionEditarClienteView.vue'),
    meta: { title: 'Editar cliente' },
  },
  {
    path: ':id',
    name: 'produccion-clientes-detalle',
    component: () => import('../views/ProduccionClienteDetalleView.vue'),
    meta: { title: 'Cliente' },
  },
]
