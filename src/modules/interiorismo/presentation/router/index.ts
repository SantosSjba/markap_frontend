import type { RouteRecordRaw } from 'vue-router'
import InteriorismoLayout from '../views/InteriorismoLayout.vue'
import { SectionLayout } from '@layouts'
import { INTERIORISMO_BASE_PATH } from '../../config/routes.constants'
import { interiorismoClientesRoutes } from '../../features/clientes'
import { interiorismoProyectosRoutes } from '../../features/proyectos'
import {
  interiorismoMaterialesCatalogoRoutes,
  interiorismoMaterialesProveedoresRoutes,
} from '../../features/materiales'
import { interiorismoEjecucionRoutes } from '../../features/ejecucion'
import { interiorismoDocumentosRoutes } from '../../features/documentos'
import { interiorismoReportesRoutes } from '../../features/reportes'
import { interiorismoConfiguracionRoutes } from '../../features/configuracion'

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
        redirect: `${INTERIORISMO_BASE_PATH}/proyectos`,
      },
      {
        path: 'presupuestos/:pathMatch(.*)*',
        redirect: `${INTERIORISMO_BASE_PATH}/proyectos`,
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
            component: SectionLayout,
            meta: { title: 'Catálogo' },
            children: interiorismoMaterialesCatalogoRoutes,
          },
          {
            path: 'proveedores',
            component: SectionLayout,
            meta: { title: 'Proveedores' },
            children: interiorismoMaterialesProveedoresRoutes,
          },
        ],
      },
      {
        path: 'ejecucion',
        component: SectionLayout,
        meta: { title: 'Ejecución' },
        children: interiorismoEjecucionRoutes,
      },
      {
        path: 'finanzas',
        redirect: `${INTERIORISMO_BASE_PATH}/proyectos`,
      },
      {
        path: 'finanzas/:projectId',
        redirect: (to) => ({
          path: `${INTERIORISMO_BASE_PATH}/proyectos/${String(to.params.projectId)}`,
          query: { tab: 'liquidacion' },
        }),
      },
      {
        path: 'calendario',
        name: 'interiorismo-calendario',
        component: () => import('../../features/calendario/presentation/views/InteriorismoCalendarioView.vue'),
        meta: { title: 'Calendario' },
      },
      {
        path: 'reportes',
        component: SectionLayout,
        meta: { title: 'Reportes' },
        children: interiorismoReportesRoutes,
      },
      {
        path: 'documentos',
        component: SectionLayout,
        meta: { title: 'Documentos' },
        children: [
          {
            path: '',
            redirect: { name: 'interiorismo-documentos-contratos' },
          },
          ...interiorismoDocumentosRoutes,
        ],
      },
      {
        path: 'configuracion',
        component: SectionLayout,
        meta: { title: 'Configuración' },
        children: interiorismoConfiguracionRoutes,
      },
    ],
  },
]
