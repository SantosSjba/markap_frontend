import type { RouteRecordRaw } from 'vue-router'
import ProduccionLayout from '../views/ProduccionLayout.vue'
import { SectionLayout } from '@layouts'
import { PRODUCCION_BASE_PATH } from '../../config/routes.constants'
import { produccionClientesRoutes } from '../../features/clientes'
import { produccionCatalogoRoutes } from '../../features/catalogo'

const placeholder = () => import('../views/ProduccionPlaceholderView.vue')

export const produccionRoutes: RouteRecordRaw[] = [
  {
    path: PRODUCCION_BASE_PATH,
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
      // Clientes
      {
        path: 'clientes',
        component: SectionLayout,
        meta: { title: 'Clientes' },
        children: produccionClientesRoutes,
      },
      { path: 'ventas/clientes', redirect: '/produccion/clientes' },
      { path: 'ventas/clientes/nuevo', redirect: '/produccion/clientes/nuevo' },
      // Catálogo de muebles
      {
        path: 'catalogo',
        component: SectionLayout,
        meta: { title: 'Catálogo de muebles' },
        children: produccionCatalogoRoutes,
      },
      // Redirecciones rutas antiguas → catálogo
      { path: 'productos', redirect: '/produccion/catalogo' },
      { path: 'productos/nuevo', redirect: '/produccion/catalogo/nuevo' },
      // Órdenes de trabajo
      {
        path: 'ordenes-trabajo',
        component: SectionLayout,
        meta: { title: 'Órdenes de trabajo' },
        children: [
          {
            path: '',
            name: 'produccion-ordenes-trabajo',
            component: placeholder,
            meta: { title: 'Órdenes de trabajo' },
          },
          {
            path: 'nueva',
            redirect: '/produccion/ordenes-trabajo',
          },
        ],
      },
      // Producción (seguimiento y etapas)
      {
        path: 'produccion',
        component: SectionLayout,
        meta: { title: 'Producción' },
        children: [
          {
            path: 'en-proceso',
            name: 'produccion-en-proceso',
            component: placeholder,
            meta: { title: 'Producción en proceso' },
          },
          {
            path: 'etapas',
            name: 'produccion-etapas',
            component: placeholder,
            meta: { title: 'Etapas de producción' },
          },
          {
            path: 'terminados',
            name: 'produccion-terminados',
            component: placeholder,
            meta: { title: 'Productos terminados' },
          },
        ],
      },
      { path: 'ordenes-trabajo/en-proceso', redirect: '/produccion/produccion/en-proceso' },
      {
        path: 'etapas',
        redirect: '/produccion/produccion/etapas',
      },
      {
        path: 'etapas/:etapa',
        redirect: (to) => `/produccion/produccion/etapas?etapa=${to.params.etapa}`,
      },
      // Inventario
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
            path: 'stock',
            name: 'produccion-inventario-stock',
            component: placeholder,
            meta: { title: 'Stock' },
          },
          {
            path: 'movimientos',
            name: 'produccion-inventario-movimientos',
            component: placeholder,
            meta: { title: 'Movimientos' },
          },
        ],
      },
      { path: 'inventario/insumos', redirect: '/produccion/inventario/stock' },
      // Compras
      {
        path: 'compras',
        component: SectionLayout,
        meta: { title: 'Compras' },
        children: [
          {
            path: 'proveedores',
            name: 'produccion-compras-proveedores',
            component: placeholder,
            meta: { title: 'Proveedores' },
          },
          {
            path: 'ordenes-compra',
            name: 'produccion-compras-ordenes-compra',
            component: placeholder,
            meta: { title: 'Órdenes de compra' },
          },
        ],
      },
      { path: 'proveedores', redirect: '/produccion/compras/proveedores' },
      { path: 'proveedores/nuevo', redirect: '/produccion/compras/proveedores' },
      { path: 'proveedores/ordenes-compra', redirect: '/produccion/compras/ordenes-compra' },
      // Ventas
      {
        path: 'ventas',
        component: SectionLayout,
        meta: { title: 'Ventas' },
        children: [
          {
            path: 'cotizaciones',
            name: 'produccion-ventas-cotizaciones',
            component: placeholder,
            meta: { title: 'Cotizaciones' },
          },
          {
            path: 'pedidos',
            name: 'produccion-ventas-pedidos',
            component: placeholder,
            meta: { title: 'Pedidos' },
          },
          {
            path: 'entregas',
            name: 'produccion-ventas-entregas',
            component: placeholder,
            meta: { title: 'Entregas' },
          },
        ],
      },
      // Costos
      {
        path: 'costos',
        component: SectionLayout,
        meta: { title: 'Costos' },
        children: [
          {
            path: 'costeo',
            name: 'produccion-costos-costeo',
            component: placeholder,
            meta: { title: 'Costeo de muebles' },
          },
          {
            path: 'mano-obra',
            name: 'produccion-costos-mano-obra',
            component: placeholder,
            meta: { title: 'Mano de obra' },
          },
          {
            path: 'gastos',
            name: 'produccion-costos-gastos',
            component: placeholder,
            meta: { title: 'Gastos adicionales' },
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
