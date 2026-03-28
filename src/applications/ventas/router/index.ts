import type { RouteRecordRaw } from 'vue-router'
import VentasLayout from '../views/VentasLayout.vue'
import { SectionLayout } from '@widgets'

export const ventasRoutes: RouteRecordRaw[] = [
  {
    path: '/ventas',
    component: VentasLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'ventas-home',
        component: () => import('../views/VentasHomeView.vue'),
        meta: { title: 'Ventas' },
      },
      {
        path: 'perfil',
        name: 'ventas-perfil',
        component: () => import('../views/VentasPerfilView.vue'),
        meta: { title: 'Mi Perfil' },
      },
      {
        path: 'clientes',
        component: SectionLayout,
        meta: { title: 'Clientes' },
        children: [
          {
            path: '',
            name: 'ventas-clientes',
            component: () => import('../views/VentasPlaceholderView.vue'),
            meta: { title: 'Clientes' },
          },
          {
            path: 'nuevo',
            name: 'ventas-clientes-nuevo',
            component: () => import('../views/VentasPlaceholderView.vue'),
            meta: { title: 'Nuevo Cliente' },
          },
        ],
      },
      {
        path: 'propiedades',
        component: SectionLayout,
        meta: { title: 'Propiedades' },
        children: [
          {
            path: '',
            name: 'ventas-propiedades',
            component: () => import('../views/VentasPlaceholderView.vue'),
            meta: { title: 'Propiedades' },
          },
          {
            path: 'nueva',
            name: 'ventas-propiedades-nueva',
            component: () => import('../views/VentasPlaceholderView.vue'),
            meta: { title: 'Nueva Propiedad' },
          },
        ],
      },
      {
        path: 'negociaciones',
        component: SectionLayout,
        meta: { title: 'Negociaciones' },
        children: [
          {
            path: '',
            name: 'ventas-negociaciones',
            component: () => import('../views/VentasPlaceholderView.vue'),
            meta: { title: 'Negociaciones' },
          },
        ],
      },
      {
        path: 'comisiones',
        component: SectionLayout,
        meta: { title: 'Comisiones' },
        children: [
          {
            path: '',
            name: 'ventas-comisiones',
            component: () => import('../views/VentasPlaceholderView.vue'),
            meta: { title: 'Comisiones' },
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
            name: 'ventas-reportes',
            component: () => import('../views/VentasPlaceholderView.vue'),
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
            name: 'ventas-configuracion',
            component: () => import('../views/VentasPlaceholderView.vue'),
            meta: { title: 'Configuración' },
          },
        ],
      },
    ],
  },
]
