import type { RouteRecordRaw } from 'vue-router'
import InteriorismoLayout from '../views/InteriorismoLayout.vue'
import { SectionLayout } from '@layouts'
import { INTERIORISMO_BASE_PATH } from '../../config/routes.constants'
import { interiorismoClientesRoutes } from '../../features/clientes'
import { interiorismoProyectosRoutes } from '../../features/proyectos'
import { interiorismoPresupuestosRoutes } from '../../features/presupuestos'
import {
  interiorismoMaterialesCatalogoRoutes,
  interiorismoMaterialesProveedoresRoutes,
} from '../../features/materiales'
import { interiorismoEjecucionRoutes } from '../../features/ejecucion'
import { interiorismoFinanzasRoutes } from '../../features/finanzas'
import { interiorismoDocumentosRoutes } from '../../features/documentos'
import { interiorismoReportesRoutes } from '../../features/reportes'

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
        component: SectionLayout,
        meta: { title: 'Finanzas' },
        children: interiorismoFinanzasRoutes,
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
        name: 'interiorismo-configuracion',
        component: placeholder,
        meta: { title: 'Configuración' },
      },
    ],
  },
]
