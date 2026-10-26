import type { RouteRecordRaw } from 'vue-router'
import ContabilidadLayout from '../views/ContabilidadLayout.vue'
import SectionLayout from '@app/layouts/SectionLayout.vue'
import { CONTABILIDAD_BASE_PATH } from '../../config/routes.constants'
import { contabilidadConfiguracionRoutes } from '../../features/configuracion/presentation/router/index'
import { contabilidadPlanCuentasRoutes } from '../../features/plan-cuentas/presentation/router/index'
import { contabilidadPeriodosRoutes } from '../../features/periodos/presentation/router/index'
import { contabilidadCentrosCostoRoutes } from '../../features/centros-costo/presentation/router/index'
import { contabilidadAsientosRoutes } from '../../features/asientos/presentation/router/index'
import { contabilidadTesoreriaRoutes } from '../../features/tesoreria/presentation/router/index'
import { contabilidadComprasRoutes } from '../../features/compras/presentation/router/index'
import { contabilidadVentasContablesRoutes } from '../../features/ventas-contables/presentation/router/index'
import { contabilidadTributosRoutes } from '../../features/tributos/presentation/router/index'
import { contabilidadLibrosERoutes } from '../../features/libros-e/presentation/router/index'
import { contabilidadReportesFinancierosRoutes } from '../../features/reportes-financieros/presentation/router/index'
import { contabilidadPlantillasAsientoRoutes } from '../../features/plantillas-asiento/presentation/router/index'
import { contabilidadTiposCambioRoutes } from '../../features/tipos-cambio/presentation/router/index'
import { contabilidadCpeLogRoutes } from '../../features/cpe-log/presentation/router/index'
import { contabilidadInventarioContableRoutes } from '../../features/inventario-contable/presentation/router/index'
import { contabilidadAuditoriaRoutes } from '../../features/auditoria/presentation/router/index'
import { contabilidadFacturacionElectronicaRoutes } from '../../features/facturacion-electronica/presentation/router/index'
import ContabilidadCierreMensualView from '../../features/cierre/presentation/views/ContabilidadCierreMensualView.vue'
export const contabilidadRoutes: RouteRecordRaw[] = [
  {
    path: CONTABILIDAD_BASE_PATH,
    component: ContabilidadLayout,
    meta: { applicationSlug: 'contabilidad', requiresAuth: true },
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
      { path: 'impuestos/declaraciones', redirect: '/contabilidad/tributos/declaraciones-sol' },
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
          ...contabilidadAuditoriaRoutes.map((r) => ({
            ...r,
            path: r.path === '' ? 'auditoria' : r.path,
          })),
        ],
      },
    ],
  },
]
