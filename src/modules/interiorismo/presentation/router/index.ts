import type { RouteRecordRaw } from 'vue-router'
import InteriorismoLayout from '../views/InteriorismoLayout.vue'
import { SectionLayout } from '@layouts'
import { INTERIORISMO_BASE_PATH } from '../../config/routes.constants'

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
        children: [
          {
            path: '',
            name: 'interiorismo-proyectos',
            component: placeholder,
            meta: { title: 'Listado de proyectos' },
          },
          {
            path: 'nuevo',
            name: 'interiorismo-proyectos-nuevo',
            component: placeholder,
            meta: { title: 'Nuevo proyecto' },
          },
          {
            path: 'en-progreso',
            name: 'interiorismo-proyectos-en-progreso',
            component: placeholder,
            meta: { title: 'En progreso' },
          },
        ],
      },
      {
        path: 'clientes',
        component: SectionLayout,
        meta: { title: 'Clientes' },
        children: [
          {
            path: '',
            name: 'interiorismo-clientes',
            component: placeholder,
            meta: { title: 'Listado de clientes' },
          },
          {
            path: 'nuevo',
            name: 'interiorismo-clientes-nuevo',
            component: placeholder,
            meta: { title: 'Nuevo cliente' },
          },
        ],
      },
      {
        path: 'presupuestos',
        component: SectionLayout,
        meta: { title: 'Presupuestos' },
        children: [
          {
            path: '',
            name: 'interiorismo-presupuestos',
            component: placeholder,
            meta: { title: 'Listado de presupuestos' },
          },
          {
            path: 'nuevo',
            name: 'interiorismo-presupuestos-nuevo',
            component: placeholder,
            meta: { title: 'Nuevo presupuesto' },
          },
        ],
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
