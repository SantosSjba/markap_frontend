import type { RouteRecordRaw } from 'vue-router'
import ProduccionLayout from '../views/ProduccionLayout.vue'
import { SectionLayout } from '@layouts'

const placeholder = () => import('../views/ProduccionPlaceholderView.vue')

export const produccionRoutes: RouteRecordRaw[] = [
  {
    path: '/produccion',
    component: ProduccionLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'produccion-home',
        component: () => import('../views/ProduccionHomeView.vue'),
        meta: { title: 'Producción de muebles' },
      },
      {
        path: 'perfil',
        name: 'produccion-perfil',
        component: () => import('../views/ProduccionPerfilView.vue'),
        meta: { title: 'Mi Perfil' },
      },
      {
        path: 'ordenes-trabajo',
        component: SectionLayout,
        meta: { title: 'Órdenes de trabajo' },
        children: [
          {
            path: '',
            name: 'produccion-ordenes-trabajo',
            component: placeholder,
            meta: { title: 'Listado de órdenes' },
          },
          {
            path: 'nueva',
            name: 'produccion-ordenes-trabajo-nueva',
            component: placeholder,
            meta: { title: 'Nueva orden' },
          },
          {
            path: 'en-proceso',
            name: 'produccion-ordenes-trabajo-en-proceso',
            component: placeholder,
            meta: { title: 'En proceso' },
          },
        ],
      },
      {
        path: 'productos',
        component: SectionLayout,
        meta: { title: 'Productos' },
        children: [
          {
            path: '',
            name: 'produccion-productos',
            component: placeholder,
            meta: { title: 'Catálogo' },
          },
          {
            path: 'nuevo',
            name: 'produccion-productos-nuevo',
            component: placeholder,
            meta: { title: 'Nuevo producto' },
          },
        ],
      },
      {
        path: 'inventario',
        component: SectionLayout,
        meta: { title: 'Inventario' },
        children: [
          {
            path: 'materiales',
            name: 'produccion-inventario-materiales',
            component: placeholder,
            meta: { title: 'Materiales' },
          },
          {
            path: 'insumos',
            name: 'produccion-inventario-insumos',
            component: placeholder,
            meta: { title: 'Insumos' },
          },
          {
            path: 'movimientos',
            name: 'produccion-inventario-movimientos',
            component: placeholder,
            meta: { title: 'Movimientos' },
          },
        ],
      },
      {
        path: 'proveedores',
        component: SectionLayout,
        meta: { title: 'Proveedores' },
        children: [
          {
            path: '',
            name: 'produccion-proveedores',
            component: placeholder,
            meta: { title: 'Listado de proveedores' },
          },
          {
            path: 'nuevo',
            name: 'produccion-proveedores-nuevo',
            component: placeholder,
            meta: { title: 'Nuevo proveedor' },
          },
          {
            path: 'ordenes-compra',
            name: 'produccion-proveedores-ordenes-compra',
            component: placeholder,
            meta: { title: 'Órdenes de compra' },
          },
        ],
      },
      {
        path: 'etapas',
        component: SectionLayout,
        meta: { title: 'Producción' },
        children: [
          {
            path: 'planificacion',
            name: 'produccion-etapas-planificacion',
            component: placeholder,
            meta: { title: 'Planificación' },
          },
          {
            path: 'corte',
            name: 'produccion-etapas-corte',
            component: placeholder,
            meta: { title: 'Corte' },
          },
          {
            path: 'ensamble',
            name: 'produccion-etapas-ensamble',
            component: placeholder,
            meta: { title: 'Ensamble' },
          },
          {
            path: 'acabados',
            name: 'produccion-etapas-acabados',
            component: placeholder,
            meta: { title: 'Acabados' },
          },
        ],
      },
      {
        path: 'reportes',
        name: 'produccion-reportes',
        component: placeholder,
        meta: { title: 'Reportes' },
      },
      {
        path: 'configuracion',
        name: 'produccion-configuracion',
        component: placeholder,
        meta: { title: 'Configuración' },
      },
    ],
  },
]
