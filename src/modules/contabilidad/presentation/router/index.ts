import type { RouteRecordRaw } from 'vue-router'
import ContabilidadLayout from '../views/ContabilidadLayout.vue'
import { SectionLayout } from '@layouts'
import { CONTABILIDAD_BASE_PATH } from '../../config/routes.constants'
import { contabilidadConfiguracionRoutes } from '../../features/configuracion'
import { contabilidadPlanCuentasRoutes } from '../../features/plan-cuentas'
import { contabilidadPeriodosRoutes } from '../../features/periodos'
import { contabilidadCentrosCostoRoutes } from '../../features/centros-costo'
import { contabilidadAsientosRoutes } from '../../features/asientos'
import { contabilidadTesoreriaRoutes } from '../../features/tesoreria'
import { contabilidadComprasRoutes } from '../../features/compras'
import { contabilidadVentasContablesRoutes } from '../../features/ventas-contables'
import { contabilidadTributosRoutes } from '../../features/tributos'
import { contabilidadLibrosERoutes } from '../../features/libros-e'

const placeholder = () => import('../views/ContabilidadPlaceholderView.vue')

export const contabilidadRoutes: RouteRecordRaw[] = [
  {
    path: CONTABILIDAD_BASE_PATH,
    component: ContabilidadLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'contabilidad-home',
        component: () => import('../views/ContabilidadHomeView.vue'),
        meta: { title: 'Sistema contable' },
      },
      {
        path: 'perfil',
        name: 'contabilidad-perfil',
        component: () => import('../views/ContabilidadPerfilView.vue'),
        meta: { title: 'Mi Perfil' },
      },
      // Contabilidad
      {
        path: 'plan-cuentas',
        component: SectionLayout,
        meta: { title: 'Plan de cuentas' },
        children: contabilidadPlanCuentasRoutes,
      },
      { path: 'plan-cuentas/nueva-cuenta', redirect: '/contabilidad/plan-cuentas' },
      {
        path: 'asientos',
        component: SectionLayout,
        meta: { title: 'Asientos contables' },
        children: contabilidadAsientosRoutes,
      },
      {
        path: 'periodos',
        component: SectionLayout,
        meta: { title: 'Periodos contables' },
        children: contabilidadPeriodosRoutes,
      },
      {
        path: 'centros-costo',
        component: SectionLayout,
        meta: { title: 'Centros de costo' },
        children: contabilidadCentrosCostoRoutes,
      },
      {
        path: 'cierre-mensual',
        name: 'contabilidad-cierre-mensual',
        component: placeholder,
        meta: { title: 'Cierre mensual' },
      },
      // Tesorería
      {
        path: 'tesoreria',
        component: SectionLayout,
        meta: { title: 'Tesorería' },
        children: contabilidadTesoreriaRoutes,
      },
      { path: 'bancos/cuentas', redirect: '/contabilidad/tesoreria/bancos' },
      { path: 'bancos/movimientos', redirect: '/contabilidad/tesoreria/movimientos' },
      { path: 'bancos/conciliacion', redirect: '/contabilidad/tesoreria/conciliaciones' },
      { path: 'caja/chica', redirect: '/contabilidad/tesoreria/caja' },
      { path: 'caja/movimientos', redirect: '/contabilidad/tesoreria/movimientos' },
      // Compras
      {
        path: 'compras',
        component: SectionLayout,
        meta: { title: 'Compras' },
        children: contabilidadComprasRoutes,
      },
      // Ventas
      {
        path: 'ventas',
        component: SectionLayout,
        meta: { title: 'Ventas' },
        children: contabilidadVentasContablesRoutes,
      },
      // Tributos
      {
        path: 'tributos',
        component: SectionLayout,
        meta: { title: 'Tributos' },
        children: contabilidadTributosRoutes,
      },
      { path: 'impuestos/igv', redirect: '/contabilidad/tributos/igv' },
      { path: 'impuestos/renta', redirect: '/contabilidad/tributos/retenciones' },
      { path: 'impuestos/declaraciones', redirect: '/contabilidad/tributos/igv' },
      // Libros electrónicos
      {
        path: 'libros-e',
        component: SectionLayout,
        meta: { title: 'Libros electrónicos' },
        children: contabilidadLibrosERoutes,
      },
      // Reportes financieros
      {
        path: 'reportes',
        component: SectionLayout,
        meta: { title: 'Reportes financieros' },
        children: [
          {
            path: 'balance-general',
            name: 'contabilidad-reportes-balance-general',
            component: placeholder,
            meta: { title: 'Balance general' },
          },
          {
            path: 'estado-resultados',
            name: 'contabilidad-reportes-estado-resultados',
            component: placeholder,
            meta: { title: 'Estado de resultados' },
          },
          {
            path: 'flujo-caja',
            name: 'contabilidad-reportes-flujo-caja',
            component: placeholder,
            meta: { title: 'Flujo de caja' },
          },
          {
            path: 'flujo-efectivo',
            name: 'contabilidad-reportes-flujo-efectivo',
            component: placeholder,
            meta: { title: 'Flujo de efectivo' },
          },
          {
            path: 'analisis-financiero',
            name: 'contabilidad-reportes-analisis-financiero',
            component: placeholder,
            meta: { title: 'Análisis financiero' },
          },
          {
            path: 'kpis',
            name: 'contabilidad-reportes-kpis',
            component: placeholder,
            meta: { title: 'KPIs' },
          },
          {
            path: 'libro-mayor',
            redirect: '/contabilidad/libros-e/libro-mayor',
          },
        ],
      },
      {
        path: 'configuracion',
        component: SectionLayout,
        meta: { title: 'Configuración' },
        children: contabilidadConfiguracionRoutes,
      },
    ],
  },
]
