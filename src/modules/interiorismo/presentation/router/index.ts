import type { RouteRecordRaw } from 'vue-router'
import InteriorismoLayout from '../views/InteriorismoLayout.vue'
import { SectionLayout } from '@layouts'
import { INTERIORISMO_BASE_PATH } from '../../config/routes.constants'
import { interiorismoClientesRoutes } from '../../features/clientes'
import { interiorismoProyectosRoutes } from '../../features/proyectos'
import { interiorismoPresupuestosRoutes } from '../../features/presupuestos'

const placeholder = () => import('../views/InteriorismoPlaceholderView.vue')

export const interiorismoRoutes: RouteRecordRaw[] = [
  {
    path: INTERIORISMO_BASE_PATH,
    component: InteriorismoLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'interiorismo-home',
        component: () => import('../views/InteriorismoHomeView.vue'),
        meta: { title: 'Interiorismo' },
      },
      {
        path: 'perfil',
        name: 'interiorismo-perfil',
        component: () => import('../views/InteriorismoPerfilView.vue'),
        meta: { title: 'Mi Perfil' },
      },
      {
        path: 'proyectos',
        component: SectionLayout,
        meta: { title: 'Proyectos' },
        children: interiorismoProyectosRoutes,
      },
      {
        path: 'clientes',
        component: SectionLayout,
        meta: { title: 'Clientes' },
        children: interiorismoClientesRoutes,
      },
      {
        path: 'presupuestos',
        component: SectionLayout,
        meta: { title: 'Presupuestos' },
        children: interiorismoPresupuestosRoutes,
      },
      {
        path: 'materiales',
        component: SectionLayout,
        meta: { title: 'Materiales' },
        children: [
          {
            path: '',
            redirect: { name: 'interiorismo-materiales-catalogo' },
          },
          {
            path: 'catalogo',
            name: 'interiorismo-materiales-catalogo',
            component: placeholder,
            meta: { title: 'Catálogo' },
          },
          {
            path: 'proveedores',
            name: 'interiorismo-materiales-proveedores',
            component: placeholder,
            meta: { title: 'Proveedores' },
          },
        ],
      },
      {
        path: 'ejecucion',
        name: 'interiorismo-ejecucion',
        component: placeholder,
        meta: { title: 'Ejecución' },
      },
      {
        path: 'finanzas',
        name: 'interiorismo-finanzas',
        component: placeholder,
        meta: { title: 'Finanzas' },
      },
      {
        path: 'calendario',
        name: 'interiorismo-calendario',
        component: placeholder,
        meta: { title: 'Calendario' },
      },
      {
        path: 'reportes',
        name: 'interiorismo-reportes',
        component: placeholder,
        meta: { title: 'Reportes' },
      },
      {
        path: 'documentos',
        name: 'interiorismo-documentos',
        component: placeholder,
        meta: { title: 'Documentos' },
      },
      {
        path: 'configuracion',
        name: 'interiorismo-configuracion',
        component: placeholder,
        meta: { title: 'Configuración' },
      },
    ],
  },
]
