import type { RouteRecordRaw } from 'vue-router'
import ContabilidadLayout from '../views/ContabilidadLayout.vue'
import { SectionLayout } from '@layouts'
import { CONTABILIDAD_BASE_PATH } from '../../config/routes.constants'
import { contabilidadConfiguracionRoutes } from '../../features/configuracion'
import { contabilidadPlanCuentasRoutes } from '../../features/plan-cuentas'

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
        children: [
          {
            path: 'libro-diario',
            name: 'contabilidad-asientos-libro-diario',
            component: placeholder,
            meta: { title: 'Asientos contables' },
          },
          {
            path: 'nuevo',
            redirect: '/contabilidad/asientos/libro-diario',
          },
        ],
      },
      {
        path: 'periodos',
        name: 'contabilidad-periodos',
        component: placeholder,
        meta: { title: 'Periodos contables' },
      },
      {
        path: 'centros-costo',
        name: 'contabilidad-centros-costo',
        component: placeholder,
        meta: { title: 'Centros de costo' },
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
        children: [
          {
            path: 'caja',
            name: 'contabilidad-tesoreria-caja',
            component: placeholder,
            meta: { title: 'Caja' },
          },
          {
            path: 'bancos',
            name: 'contabilidad-tesoreria-bancos',
            component: placeholder,
            meta: { title: 'Bancos' },
          },
          {
            path: 'conciliaciones',
            name: 'contabilidad-tesoreria-conciliaciones',
            component: placeholder,
            meta: { title: 'Conciliaciones' },
          },
          {
            path: 'movimientos',
            name: 'contabilidad-tesoreria-movimientos',
            component: placeholder,
            meta: { title: 'Movimientos' },
          },
          {
            path: 'transferencias',
            name: 'contabilidad-tesoreria-transferencias',
            component: placeholder,
            meta: { title: 'Transferencias' },
          },
        ],
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
        children: [
          {
            path: 'facturas',
            name: 'contabilidad-compras-facturas',
            component: placeholder,
            meta: { title: 'Facturas de compra' },
          },
          {
            path: 'notas-credito',
            name: 'contabilidad-compras-notas-credito',
            component: placeholder,
            meta: { title: 'Notas de crédito' },
          },
          {
            path: 'proveedores',
            name: 'contabilidad-compras-proveedores',
            component: placeholder,
            meta: { title: 'Proveedores' },
          },
          {
            path: 'pagos',
            name: 'contabilidad-compras-pagos',
            component: placeholder,
            meta: { title: 'Pagos' },
          },
          {
            path: 'registrar',
            redirect: '/contabilidad/compras/facturas',
          },
        ],
      },
      // Ventas
      {
        path: 'ventas',
        component: SectionLayout,
        meta: { title: 'Ventas' },
        children: [
          {
            path: 'facturas',
            name: 'contabilidad-ventas-facturas',
            component: placeholder,
            meta: { title: 'Facturas' },
          },
          {
            path: 'boletas',
            name: 'contabilidad-ventas-boletas',
            component: placeholder,
            meta: { title: 'Boletas' },
          },
          {
            path: 'notas-credito',
            name: 'contabilidad-ventas-notas-credito',
            component: placeholder,
            meta: { title: 'Notas de crédito' },
          },
          {
            path: 'clientes',
            name: 'contabilidad-ventas-clientes',
            component: placeholder,
            meta: { title: 'Clientes' },
          },
          {
            path: 'cobros',
            name: 'contabilidad-ventas-cobros',
            component: placeholder,
            meta: { title: 'Cobros' },
          },
          {
            path: 'nueva-factura',
            redirect: '/contabilidad/ventas/facturas',
          },
        ],
      },
      // Tributos
      {
        path: 'tributos',
        component: SectionLayout,
        meta: { title: 'Tributos' },
        children: [
          {
            path: 'igv',
            name: 'contabilidad-tributos-igv',
            component: placeholder,
            meta: { title: 'IGV' },
          },
          {
            path: 'detracciones',
            name: 'contabilidad-tributos-detracciones',
            component: placeholder,
            meta: { title: 'Detracciones' },
          },
          {
            path: 'retenciones',
            name: 'contabilidad-tributos-retenciones',
            component: placeholder,
            meta: { title: 'Retenciones' },
          },
          {
            path: 'percepciones',
            name: 'contabilidad-tributos-percepciones',
            component: placeholder,
            meta: { title: 'Percepciones' },
          },
        ],
      },
      { path: 'impuestos/igv', redirect: '/contabilidad/tributos/igv' },
      { path: 'impuestos/renta', redirect: '/contabilidad/tributos/retenciones' },
      { path: 'impuestos/declaraciones', redirect: '/contabilidad/tributos/igv' },
      // Libros electrónicos
      {
        path: 'libros-e',
        component: SectionLayout,
        meta: { title: 'Libros electrónicos' },
        children: [
          {
            path: 'registro-compras',
            name: 'contabilidad-libros-registro-compras',
            component: placeholder,
            meta: { title: 'Registro de compras' },
          },
          {
            path: 'registro-ventas',
            name: 'contabilidad-libros-registro-ventas',
            component: placeholder,
            meta: { title: 'Registro de ventas' },
          },
          {
            path: 'libro-diario',
            name: 'contabilidad-libros-libro-diario',
            component: placeholder,
            meta: { title: 'Libro diario' },
          },
          {
            path: 'libro-mayor',
            name: 'contabilidad-libros-libro-mayor',
            component: placeholder,
            meta: { title: 'Libro mayor' },
          },
          {
            path: 'libro-caja',
            name: 'contabilidad-libros-libro-caja',
            component: placeholder,
            meta: { title: 'Libro caja' },
          },
          {
            path: 'libro-bancos',
            name: 'contabilidad-libros-libro-bancos',
            component: placeholder,
            meta: { title: 'Libro bancos' },
          },
          {
            path: 'ple',
            name: 'contabilidad-libros-ple',
            component: placeholder,
            meta: { title: 'PLE' },
          },
        ],
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
