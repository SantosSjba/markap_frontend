import type { RouteRecordRaw } from 'vue-router'

/**
 * Rutas bajo `/interiorismo/clientes` (SectionLayout).
 */
export const interiorismoClientesRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'interiorismo-clientes',
    component: () => import('../views/InteriorismoClientesView.vue'),
    meta: { title: 'Clientes' },
  },
  {
    path: 'nuevo',
    name: 'interiorismo-clientes-nuevo',
    component: () => import('../views/InteriorismoNuevoClienteView.vue'),
    meta: { title: 'Nuevo cliente' },
  },
  {
    path: ':id/editar',
    name: 'interiorismo-clientes-editar',
    component: () => import('../views/InteriorismoEditarClienteView.vue'),
    meta: { title: 'Editar cliente' },
  },
  {
    path: ':id',
    name: 'interiorismo-clientes-detalle',
    component: () => import('../views/InteriorismoClienteDetalleView.vue'),
    meta: { title: 'Cliente' },
  },
]
