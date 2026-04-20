import type { RouteRecordRaw } from 'vue-router'

/**
 * Rutas del módulo Propiedades (se montan como children de /alquileres/propiedades)
 */
export const propiedadesRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'alquileres-propiedades',
    component: () => import('../views/PropiedadesView.vue'),
    meta: { title: 'Propiedades' },
  },
  {
    path: 'nueva',
    name: 'alquileres-propiedades-nueva',
    component: () => import('../views/NuevaPropiedadView.vue'),
    meta: { title: 'Nueva Propiedad' },
  },
  {
    path: ':id/editar',
    name: 'alquileres-propiedades-editar',
    component: () => import('../views/EditarPropiedadView.vue'),
    meta: { title: 'Editar Propiedad' },
  },
]
