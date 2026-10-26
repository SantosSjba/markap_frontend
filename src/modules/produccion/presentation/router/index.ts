import type { RouteRecordRaw } from 'vue-router'
import ProduccionLayout from '../views/ProduccionLayout.vue'
import SectionLayout from '@app/layouts/SectionLayout.vue'
import { PRODUCCION_BASE_PATH } from '../../config/routes.constants'
import { produccionClientesRoutes } from '../../features/clientes/presentation/router/index'
import { produccionCatalogoRoutes } from '../../features/catalogo/presentation/router/index'
import { produccionCostosRoutes } from '../../features/costos/presentation/router/index'
import { produccionInventarioRoutes } from '../../features/inventario/presentation/router/index'
import { produccionComprasRoutes } from '../../features/compras/presentation/router/index'
import {
  produccionTallerRoutes,
  produccionSeguimientoRoutes,
} from '../../features/taller/presentation/router/index'
import { produccionVentasRoutes } from '../../features/ventas/presentation/router/index'
import { produccionReportesRoutes } from '../../features/reportes/presentation/router/index'
import { produccionConfiguracionRoutes } from '../../features/configuracion/presentation/router/index'
export const produccionRoutes: RouteRecordRaw[] = [
  {
    path: PRODUCCION_BASE_PATH,
    component: ProduccionLayout,
    meta: { applicationSlug: 'produccion', requiresAuth: true },
    children: [
      {
        path: '',
        name: 'produccion-home',
        component: () => import('../views/ProduccionHomeView.vue'),
        meta: { title: 'MOCZ · Muebles Orgánicos CZ' },
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
        children: produccionTallerRoutes,
      },
      {
        path: 'produccion',
        component: SectionLayout,
        meta: { title: 'Producción' },
        children: produccionSeguimientoRoutes,
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
        children: produccionInventarioRoutes,
      },
      { path: 'inventario/insumos', redirect: '/produccion/inventario/stock' },
      // Compras
      {
        path: 'compras',
        component: SectionLayout,
        meta: { title: 'Compras' },
        children: produccionComprasRoutes,
      },
      { path: 'proveedores', redirect: '/produccion/compras/proveedores' },
      { path: 'proveedores/nuevo', redirect: '/produccion/compras/proveedores' },
      { path: 'proveedores/ordenes-compra', redirect: '/produccion/compras/ordenes-compra' },
      // Ventas
      {
        path: 'ventas',
        component: SectionLayout,
        meta: { title: 'Ventas' },
        children: produccionVentasRoutes,
      },
      // Costos
      {
        path: 'costos',
        component: SectionLayout,
        meta: { title: 'Costos' },
        children: produccionCostosRoutes,
      },
      {
        path: 'reportes',
        component: SectionLayout,
        meta: { title: 'Reportes' },
        children: produccionReportesRoutes,
      },
      {
        path: 'configuracion',
        component: SectionLayout,
        meta: { title: 'Configuración' },
        children: produccionConfiguracionRoutes,
      },
    ],
  },
]
