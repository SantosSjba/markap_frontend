import type { RouteRecordRaw } from 'vue-router'
import ArquitecturaLayout from '../views/ArquitecturaLayout.vue'
import { SectionLayout } from '@widgets'

const placeholder = () => import('../views/ArquitecturaPlaceholderView.vue')

export const arquitecturaRoutes: RouteRecordRaw[] = [
  {
    path: '/arquitectura',
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
        children: [
          {
            path: '',
            name: 'arquitectura-proyectos',
            component: placeholder,
            meta: { title: 'Listado de proyectos' },
          },
          {
            path: 'nuevo',
            name: 'arquitectura-proyectos-nuevo',
            component: placeholder,
            meta: { title: 'Nuevo proyecto' },
          },
          {
            path: 'en-ejecucion',
            name: 'arquitectura-proyectos-en-ejecucion',
            component: placeholder,
            meta: { title: 'En ejecución' },
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
            name: 'arquitectura-clientes',
            component: placeholder,
            meta: { title: 'Listado de clientes' },
          },
          {
            path: 'nuevo',
            name: 'arquitectura-clientes-nuevo',
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
        name: 'arquitectura-configuracion',
        component: placeholder,
        meta: { title: 'Configuración' },
      },
    ],
  },
]
