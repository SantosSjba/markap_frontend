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
            meta: { title: 'Listado de Clientes' },
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
            meta: { title: 'Listado de Propiedades' },
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
        path: 'procesos',
        component: SectionLayout,
        meta: { title: 'Procesos de Venta' },
        children: [
          {
            path: '',
            name: 'ventas-procesos',
            component: () => import('../views/VentasPlaceholderView.vue'),
            meta: { title: 'Procesos de Venta' },
          },
        ],
      },
      {
        path: 'separaciones',
        component: SectionLayout,
        meta: { title: 'Separaciones' },
        children: [
          {
            path: '',
            name: 'ventas-separaciones',
            component: () => import('../views/VentasPlaceholderView.vue'),
            meta: { title: 'Separaciones' },
          },
        ],
      },
      {
        path: 'cierres',
        component: SectionLayout,
        meta: { title: 'Cierres' },
        children: [
          {
            path: '',
            name: 'ventas-cierres',
            component: () => import('../views/VentasPlaceholderView.vue'),
            meta: { title: 'Cierres' },
          },
        ],
      },
      {
        path: 'pagos',
        component: SectionLayout,
        meta: { title: 'Pagos' },
        children: [
          {
            path: '',
            name: 'ventas-pagos',
            component: () => import('../views/VentasPlaceholderView.vue'),
            meta: { title: 'Pagos' },
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
        path: 'costos-documentacion',
        component: SectionLayout,
        meta: { title: 'Costos de Documentación' },
        children: [
          {
            path: '',
            name: 'ventas-costos-documentacion',
            component: () => import('../views/VentasPlaceholderView.vue'),
            meta: { title: 'Costos de Documentación' },
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
