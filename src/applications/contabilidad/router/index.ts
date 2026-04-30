import type { RouteRecordRaw } from 'vue-router'
import ContabilidadLayout from '../views/ContabilidadLayout.vue'
import { SectionLayout } from '@layouts'

const placeholder = () => import('../views/ContabilidadPlaceholderView.vue')

export const contabilidadRoutes: RouteRecordRaw[] = [
  {
    path: '/contabilidad',
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
      {
        path: 'plan-cuentas',
        component: SectionLayout,
        meta: { title: 'Plan de cuentas' },
        children: [
          {
            path: '',
            name: 'contabilidad-plan-cuentas',
            component: placeholder,
            meta: { title: 'Plan contable' },
          },
          {
            path: 'nueva-cuenta',
            name: 'contabilidad-plan-cuentas-nueva',
            component: placeholder,
            meta: { title: 'Nueva cuenta' },
          },
        ],
      },
      {
        path: 'asientos',
        component: SectionLayout,
        meta: { title: 'Asientos contables' },
        children: [
          {
            path: 'libro-diario',
            name: 'contabilidad-asientos-libro-diario',
            component: placeholder,
            meta: { title: 'Libro diario' },
          },
          {
            path: 'nuevo',
            name: 'contabilidad-asientos-nuevo',
            component: placeholder,
            meta: { title: 'Nuevo asiento' },
          },
        ],
      },
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
            path: 'registrar',
            name: 'contabilidad-compras-registrar',
            component: placeholder,
            meta: { title: 'Registrar compra' },
          },
        ],
      },
      {
        path: 'ventas',
        component: SectionLayout,
        meta: { title: 'Ventas (contabilidad)' },
        children: [
          {
            path: 'facturas',
            name: 'contabilidad-ventas-facturas',
            component: placeholder,
            meta: { title: 'Facturas de venta' },
          },
          {
            path: 'nueva-factura',
            name: 'contabilidad-ventas-nueva-factura',
            component: placeholder,
            meta: { title: 'Nueva factura' },
          },
        ],
      },
      {
        path: 'bancos',
        component: SectionLayout,
        meta: { title: 'Bancos' },
        children: [
          {
            path: 'cuentas',
            name: 'contabilidad-bancos-cuentas',
            component: placeholder,
            meta: { title: 'Cuentas bancarias' },
          },
          {
            path: 'movimientos',
            name: 'contabilidad-bancos-movimientos',
            component: placeholder,
            meta: { title: 'Movimientos' },
          },
          {
            path: 'conciliacion',
            name: 'contabilidad-bancos-conciliacion',
            component: placeholder,
            meta: { title: 'Conciliación' },
          },
        ],
      },
      {
        path: 'caja',
        component: SectionLayout,
        meta: { title: 'Caja' },
        children: [
          {
            path: 'chica',
            name: 'contabilidad-caja-chica',
            component: placeholder,
            meta: { title: 'Caja chica' },
          },
          {
            path: 'movimientos',
            name: 'contabilidad-caja-movimientos',
            component: placeholder,
            meta: { title: 'Movimientos' },
          },
        ],
      },
      {
        path: 'impuestos',
        component: SectionLayout,
        meta: { title: 'Impuestos' },
        children: [
          {
            path: 'igv',
            name: 'contabilidad-impuestos-igv',
            component: placeholder,
            meta: { title: 'IGV' },
          },
          {
            path: 'renta',
            name: 'contabilidad-impuestos-renta',
            component: placeholder,
            meta: { title: 'Impuesto a la renta' },
          },
          {
            path: 'declaraciones',
            name: 'contabilidad-impuestos-declaraciones',
            component: placeholder,
            meta: { title: 'Declaraciones' },
          },
        ],
      },
      {
        path: 'reportes',
        component: SectionLayout,
        meta: { title: 'Reportes' },
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
            path: 'libro-mayor',
            name: 'contabilidad-reportes-libro-mayor',
            component: placeholder,
            meta: { title: 'Libro mayor' },
          },
          {
            path: 'flujo-caja',
            name: 'contabilidad-reportes-flujo-caja',
            component: placeholder,
            meta: { title: 'Flujo de caja' },
          },
        ],
      },
      {
        path: 'configuracion',
        name: 'contabilidad-configuracion',
        component: placeholder,
        meta: { title: 'Configuración' },
      },
    ],
  },
]
