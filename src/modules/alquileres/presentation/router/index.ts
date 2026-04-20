import type { RouteRecordRaw } from 'vue-router'
import AlquileresLayout from '../views/AlquileresLayout.vue'
import { SectionLayout } from '@layouts'
import { clientesRoutes } from '@modules/alquileres/features/clientes'
import { propiedadesRoutes } from '@modules/alquileres/features/propiedades'
import { agentesRoutes } from '@modules/alquileres/features/agentes'
import { cobranzasRoutes } from '@modules/alquileres/features/cobranzas'
import { configuracionRoutes } from '@modules/alquileres/features/configuracion'
import { alquileresReportesRoutes } from '@modules/alquileres/features/reportes'
import { ALQUILERES_BASE_PATH } from '../../config/routes.constants'

export const alquileresRoutes: RouteRecordRaw[] = [
  {
    path: ALQUILERES_BASE_PATH,
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
            component: () =>
              import(
                '@modules/alquileres/features/alquileres/presentation/views/AlquileresContratosView.vue'
              ),
            meta: { title: 'Alquileres' },
          },
          {
            path: 'nuevo',
            name: 'alquileres-contratos-nuevo',
            component: () =>
              import('@modules/alquileres/features/alquileres/presentation/views/NuevoAlquilerView.vue'),
            meta: { title: 'Nuevo Alquiler' },
          },
          {
            path: ':id',
            name: 'alquileres-contratos-detalle',
            component: () =>
              import('@modules/alquileres/features/alquileres/presentation/views/DetalleAlquilerView.vue'),
            meta: { title: 'Detalle Alquiler' },
          },
          {
            path: ':id/editar',
            name: 'alquileres-contratos-editar',
            component: () =>
              import('@modules/alquileres/features/alquileres/presentation/views/EditarAlquilerView.vue'),
            meta: { title: 'Editar Alquiler' },
          },
          {
            path: ':id/distribucion-financiera',
            name: 'alquileres-contratos-distribucion-financiera',
            component: () =>
              import(
                '@modules/alquileres/features/alquileres/presentation/views/DistribucionFinancieraView.vue'
              ),
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
        children: alquileresReportesRoutes,
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
