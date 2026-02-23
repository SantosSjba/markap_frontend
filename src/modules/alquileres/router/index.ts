import type { RouteRecordRaw } from 'vue-router'
import AlquileresLayout from '../views/AlquileresLayout.vue'
import { SectionLayout } from '@layouts'
import { clientesRoutes } from '@modules/clientes/router'
import { propiedadesRoutes } from '@modules/propiedades/router'

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
        component: SectionLayout,
        meta: { title: 'Clientes' },
        children: clientesRoutes,
      },
      {
        path: 'propiedades',
        component: SectionLayout,
        meta: { title: 'Propiedades' },
        children: propiedadesRoutes,
      },
      {
        path: 'contratos',
        component: SectionLayout,
        meta: { title: 'Alquileres' },
        children: [
          {
            path: '',
            name: 'alquileres-contratos',
            component: () => import('../views/AlquileresContratosView.vue'),
            meta: { title: 'Alquileres' },
          },
          {
            path: 'nuevo',
            name: 'alquileres-contratos-nuevo',
            component: () => import('../views/NuevoAlquilerView.vue'),
            meta: { title: 'Nuevo Alquiler' },
          },
          {
            path: ':id',
            name: 'alquileres-contratos-detalle',
            component: () => import('../views/DetalleAlquilerView.vue'),
            meta: { title: 'Detalle Alquiler' },
          },
          {
            path: ':id/editar',
            name: 'alquileres-contratos-editar',
            component: () => import('../views/EditarAlquilerView.vue'),
            meta: { title: 'Editar Alquiler' },
          },
        ],
      },
      {
        path: 'inquilinos',
        component: SectionLayout,
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
        component: SectionLayout,
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
        component: SectionLayout,
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
        component: SectionLayout,
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
