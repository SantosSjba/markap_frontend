import type { RouteRecordRaw } from 'vue-router'
import AlquileresLayout from '../views/AlquileresLayout.vue'
import { SectionLayout } from '@widgets'
import { clientesRoutes } from '@applications/alquileres/clientes/router'
import { propiedadesRoutes } from '@applications/alquileres/propiedades/router'
import { agentesRoutes } from '@applications/alquileres/agentes/router'
import { cobranzasRoutes } from '@applications/alquileres/cobranzas/router'
import { configuracionRoutes } from '@applications/alquileres/configuracion/router'

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
        path: 'agentes',
        component: SectionLayout,
        meta: { title: 'Agentes' },
        children: agentesRoutes,
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
          {
            path: ':id/distribucion-financiera',
            name: 'alquileres-contratos-distribucion-financiera',
            component: () => import('../views/DistribucionFinancieraView.vue'),
            meta: { title: 'Distribución Financiera' },
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
        children: cobranzasRoutes,
      },
      {
        path: 'reportes',
        component: SectionLayout,
        meta: { title: 'Reportes' },
        children: [
          {
            path: '',
            name: 'alquileres-reportes',
            component: () => import('@applications/alquileres/reportes/views/ReportesView.vue'),
            meta: { title: 'Reportes' },
          },
        ],
      },
      {
        path: 'configuracion',
        component: SectionLayout,
        meta: { title: 'Configuración' },
        children: configuracionRoutes,
      },
    ],
  },
]
