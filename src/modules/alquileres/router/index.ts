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
        path: 'clientes',
        component: () => import('../views/SectionLayout.vue'),
        meta: { title: 'Clientes' },
        children: [
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
        ],
      },
      {
        path: 'propiedades',
        component: () => import('../views/SectionLayout.vue'),
        meta: { title: 'Propiedades' },
        children: [
          {
            path: '',
            name: 'alquileres-propiedades',
            component: () => import('../views/AlquileresPropiedadesView.vue'),
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
        ],
      },
      {
        path: 'contratos',
        component: () => import('../views/SectionLayout.vue'),
        meta: { title: 'Contratos' },
        children: [
          {
            path: '',
            name: 'alquileres-contratos',
            component: () => import('../views/AlquileresPlaceholderView.vue'),
            meta: { title: 'Contratos' },
          },
        ],
      },
      {
        path: 'inquilinos',
        component: () => import('../views/SectionLayout.vue'),
        meta: { title: 'Inquilinos' },
        children: [
          {
            path: '',
            name: 'alquileres-inquilinos',
            component: () => import('../views/AlquileresPlaceholderView.vue'),
            meta: { title: 'Inquilinos' },
          },
        ],
      },
      {
        path: 'cobranzas',
        component: () => import('../views/SectionLayout.vue'),
        meta: { title: 'Cobranzas' },
        children: [
          {
            path: '',
            name: 'alquileres-cobranzas',
            component: () => import('../views/AlquileresPlaceholderView.vue'),
            meta: { title: 'Cobranzas' },
          },
        ],
      },
      {
        path: 'reportes',
        component: () => import('../views/SectionLayout.vue'),
        meta: { title: 'Reportes' },
        children: [
          {
            path: '',
            name: 'alquileres-reportes',
            component: () => import('../views/AlquileresPlaceholderView.vue'),
            meta: { title: 'Reportes' },
          },
        ],
      },
      {
        path: 'configuracion',
        component: () => import('../views/SectionLayout.vue'),
        meta: { title: 'Configuración' },
        children: [
          {
            path: '',
            name: 'alquileres-configuracion',
            component: () => import('../views/AlquileresPlaceholderView.vue'),
            meta: { title: 'Configuración' },
          },
        ],
      },
    ],
  },
]
