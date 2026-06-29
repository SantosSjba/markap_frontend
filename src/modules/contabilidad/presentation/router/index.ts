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
import { contabilidadReportesFinancierosRoutes } from '../../features/reportes-financieros'
import { contabilidadPlantillasAsientoRoutes } from '../../features/plantillas-asiento'
import { contabilidadTiposCambioRoutes } from '../../features/tipos-cambio'
import { contabilidadCpeLogRoutes } from '../../features/cpe-log'
import { contabilidadInventarioContableRoutes } from '../../features/inventario-contable'
import { contabilidadAuditoriaRoutes } from '../../features/auditoria'
import { contabilidadFacturacionElectronicaRoutes } from '../../features/facturacion-electronica'
import { ContabilidadCierreMensualView } from '../../features/cierre'

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
        children: [...contabilidadAsientosRoutes, ...contabilidadPlantillasAsientoRoutes],
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
        component: ContabilidadCierreMensualView,
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
      { path: 'impuestos/renta', redirect: '/contabilidad/tributos/renta' },
      { path: 'impuestos/declaraciones', redirect: '/contabilidad/tributos/igv' },
      // Inventario permanente
      {
        path: 'inventario-permanente',
        component: SectionLayout,
        meta: { title: 'Inventario permanente' },
        children: contabilidadInventarioContableRoutes,
      },
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
        children: contabilidadReportesFinancierosRoutes,
      },
      {
        path: 'configuracion',
        component: SectionLayout,
        meta: { title: 'Configuración' },
        children: [
          ...contabilidadConfiguracionRoutes,
          ...contabilidadTiposCambioRoutes,
          ...contabilidadCpeLogRoutes,
          ...contabilidadFacturacionElectronicaRoutes,
          ...contabilidadAuditoriaRoutes.map((r) => ({ ...r, path: r.path === '' ? 'auditoria' : r.path })),
        ],
      },
    ],
  },
]
