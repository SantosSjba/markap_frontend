import type { RouteRecordRaw } from 'vue-router'

/**
 * Rutas bajo `/arquitectura/clientes` (SectionLayout).
 */
export const arquitecturaClientesRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'arquitectura-clientes',
    component: () => import('../views/ArquitecturaClientesView.vue'),
    meta: { title: 'Clientes' },
  },
  {
    path: 'nuevo',
    name: 'arquitectura-clientes-nuevo',
    component: () => import('../views/ArquitecturaNuevoClienteView.vue'),
    meta: { title: 'Nuevo cliente' },
  },
  {
    path: ':id/editar',
    name: 'arquitectura-clientes-editar',
    component: () => import('../views/ArquitecturaEditarClienteView.vue'),
    meta: { title: 'Editar cliente' },
  },
  {
    path: ':id',
    name: 'arquitectura-clientes-detalle',
    component: () => import('../views/ArquitecturaClienteDetalleView.vue'),
    meta: { title: 'Cliente' },
  },
]
