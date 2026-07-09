import type { RouteRecordRaw } from 'vue-router'
import ArquitecturaLayout from '../views/ArquitecturaLayout.vue'
import { SectionLayout } from '@layouts'
import { ARQUITECTURA_BASE_PATH } from '../../config/routes.constants'
import { arquitecturaClientesRoutes } from '../../features/clientes'
import { arquitecturaConfiguracionRoutes } from '../../features/configuracion'
import { arquitecturaProyectosRoutes } from '../../features/proyectos'

const placeholder = () => import('../views/ArquitecturaPlaceholderView.vue')

export const arquitecturaRoutes: RouteRecordRaw[] = [
  {
    path: ARQUITECTURA_BASE_PATH,
    component: ArquitecturaLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'arquitectura-home',
        component: () => import('../views/ArquitecturaHomeView.vue'),
        meta: { title: 'Arquitectura' },
      },
      {
        path: 'perfil',
        name: 'arquitectura-perfil',
        component: () => import('../views/ArquitecturaPerfilView.vue'),
        meta: { title: 'Mi Perfil' },
      },
      {
        path: 'proyectos',
        component: SectionLayout,
        meta: { title: 'Proyectos' },
        children: arquitecturaProyectosRoutes,
      },
      {
        path: 'clientes',
        component: SectionLayout,
        meta: { title: 'Clientes' },
        children: arquitecturaClientesRoutes,
      },
      {
        path: 'presupuestos',
        component: SectionLayout,
        meta: { title: 'Presupuestos' },
        children: [
          {
            path: '',
            name: 'arquitectura-presupuestos',
            component: placeholder,
            meta: { title: 'Listado de presupuestos' },
          },
          {
            path: 'nuevo',
            name: 'arquitectura-presupuestos-nuevo',
            component: placeholder,
            meta: { title: 'Nuevo presupuesto' },
          },
        ],
      },
      {
        path: 'cronograma',
        name: 'arquitectura-cronograma',
        component: placeholder,
        meta: { title: 'Cronograma' },
      },
      {
        path: 'reportes',
        name: 'arquitectura-reportes',
        component: placeholder,
        meta: { title: 'Reportes' },
      },
      {
        path: 'configuracion',
        component: SectionLayout,
        meta: { title: 'Configuración' },
        children: arquitecturaConfiguracionRoutes,
      },
    ],
  },
]
