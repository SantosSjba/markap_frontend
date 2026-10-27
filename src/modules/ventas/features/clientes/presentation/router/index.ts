import type { RouteRecordRaw } from 'vue-router'
export const ventasClientesRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'ventas-clientes',
    component: () => import('../views/VentasClientesView.vue'),
    meta: { title: 'Listado de Clientes' },
  },
  // Antigua vista «Propietarios»: ahora es el listado con el filtro de tipo aplicado.
  {
    path: 'propietarios',
    redirect: { name: 'ventas-clientes', query: { tipo: 'OWNER' } },
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
