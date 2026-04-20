import type { RouteRecordRaw } from 'vue-router'

export const ventasPropiedadesRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'ventas-propiedades',
    component: () => import('../views/VentasPropiedadesView.vue'),
    meta: { title: 'Listado de Propiedades' },
  },
  {
    path: 'nueva',
    name: 'ventas-propiedades-nueva',
    component: () => import('../views/VentasNuevaPropiedadView.vue'),
    meta: { title: 'Nueva Propiedad' },
  },
  {
    path: ':id/editar',
    name: 'ventas-propiedades-editar',
    component: () => import('../views/VentasEditarPropiedadView.vue'),
    meta: { title: 'Editar Propiedad' },
  },
]
