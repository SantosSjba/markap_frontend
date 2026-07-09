import type { RouteRecordRaw } from 'vue-router'
import ArquitecturaLayout from '../views/ArquitecturaLayout.vue'
import { SectionLayout } from '@layouts'
import { ARQUITECTURA_BASE_PATH } from '../../config/routes.constants'
import { arquitecturaClientesRoutes } from '../../features/clientes'
import { arquitecturaConfiguracionRoutes } from '../../features/configuracion'
import { arquitecturaProyectosRoutes } from '../../features/proyectos'
import { arquitecturaPresupuestosRoutes } from '../../features/presupuestos'
import { arquitecturaDocumentosRoutes } from '../../features/documentos'
import { arquitecturaEjecucionRoutes } from '../../features/ejecucion'
import {
  arquitecturaMaterialesCatalogoRoutes,
  arquitecturaMaterialesProveedoresRoutes,
} from '../../features/materiales'

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
        children: arquitecturaPresupuestosRoutes,
      },
      {
        path: 'cronograma',
        name: 'arquitectura-cronograma',
        component: () => import('../../features/cronograma/presentation/views/ArquitecturaCronogramaView.vue'),
        meta: { title: 'Cronograma' },
      },
      {
        path: 'documentos',
        component: SectionLayout,
        meta: { title: 'Documentos' },
        children: [
          {
            path: '',
            redirect: { name: 'arquitectura-documentos-contratos' },
          },
          ...arquitecturaDocumentosRoutes,
        ],
      },
      {
        path: 'materiales',
        component: SectionLayout,
        meta: { title: 'Materiales' },
        children: [
          {
            path: '',
            redirect: { name: 'arquitectura-materiales-catalogo' },
          },
          {
            path: 'catalogo',
            component: SectionLayout,
            meta: { title: 'Catálogo' },
            children: arquitecturaMaterialesCatalogoRoutes,
          },
          {
            path: 'proveedores',
            component: SectionLayout,
            meta: { title: 'Proveedores' },
            children: arquitecturaMaterialesProveedoresRoutes,
          },
        ],
      },
      {
        path: 'ejecucion',
        component: SectionLayout,
        meta: { title: 'Ejecución' },
        children: arquitecturaEjecucionRoutes,
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
