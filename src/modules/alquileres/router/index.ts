import type { RouteRecordRaw } from 'vue-router'
import AlquileresLayout from '../views/AlquileresLayout.vue'

export const alquileresRoutes: RouteRecordRaw[] = [
  {
    path: '/alquileres',
    component: AlquileresLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'alquileres-home',
        component: () => import('../views/AlquileresHomeView.vue'),
        meta: { title: 'Alquileres' },
      },
      {
        path: 'perfil',
        name: 'alquileres-perfil',
        component: () => import('../views/AlquileresPerfilView.vue'),
        meta: { title: 'Mi Perfil' },
      },
      {
        path: 'propiedades',
        name: 'alquileres-propiedades',
        component: () => import('../views/AlquileresPropiedadesView.vue'),
        meta: { title: 'Propiedades' },
      },
      {
        path: 'propiedades/nueva',
        name: 'alquileres-propiedades-nueva',
        component: () => import('../views/AlquileresPropiedadesView.vue'),
        meta: { title: 'Nueva Propiedad' },
      },
      {
        path: 'propiedades/disponibles',
        name: 'alquileres-propiedades-disponibles',
        component: () => import('../views/AlquileresPropiedadesView.vue'),
        meta: { title: 'Propiedades Disponibles' },
      },
      {
        path: 'contratos',
        name: 'alquileres-contratos',
        component: () => import('../views/AlquileresPlaceholderView.vue'),
        meta: { title: 'Contratos' },
      },
      {
        path: 'inquilinos',
        name: 'alquileres-inquilinos',
        component: () => import('../views/AlquileresPlaceholderView.vue'),
        meta: { title: 'Inquilinos' },
      },
      {
        path: 'cobranzas',
        name: 'alquileres-cobranzas',
        component: () => import('../views/AlquileresPlaceholderView.vue'),
        meta: { title: 'Cobranzas' },
      },
      {
        path: 'reportes',
        name: 'alquileres-reportes',
        component: () => import('../views/AlquileresPlaceholderView.vue'),
        meta: { title: 'Reportes' },
      },
      {
        path: 'configuracion',
        name: 'alquileres-configuracion',
        component: () => import('../views/AlquileresPlaceholderView.vue'),
        meta: { title: 'Configuración' },
      },
    ],
  },
]
