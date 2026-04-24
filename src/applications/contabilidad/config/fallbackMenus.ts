import type { MenuItem } from '@shared/types'

export const CONTABILIDAD_FALLBACK_MENUS: MenuItem[] = [
  {
    id: 'cont-fb-dash',
    label: 'Dashboard',
    icon: 'layout-dashboard',
    path: '/contabilidad',
    order: 0,
  },
  {
    id: 'cont-fb-plan',
    label: 'Plan de cuentas',
    icon: 'list-tree',
    path: null,
    order: 1,
    children: [
      {
        id: 'cont-fb-plan-tree',
        label: 'Plan contable',
        icon: null,
        path: '/contabilidad/plan-cuentas',
        order: 0,
      },
      {
        id: 'cont-fb-plan-new',
        label: 'Nueva cuenta',
        icon: null,
        path: '/contabilidad/plan-cuentas/nueva-cuenta',
        order: 1,
      },
    ],
  },
  {
    id: 'cont-fb-asientos',
    label: 'Asientos contables',
    icon: 'book-open',
    path: null,
    order: 2,
    children: [
      {
        id: 'cont-fb-as-lib',
        label: 'Libro diario',
        icon: null,
        path: '/contabilidad/asientos/libro-diario',
        order: 0,
      },
      {
        id: 'cont-fb-as-new',
        label: 'Nuevo asiento',
        icon: null,
        path: '/contabilidad/asientos/nuevo',
        order: 1,
      },
    ],
  },
  {
    id: 'cont-fb-comp',
    label: 'Compras',
    icon: 'shopping-cart',
    path: null,
    order: 3,
    children: [
      {
        id: 'cont-fb-comp-fac',
        label: 'Facturas de compra',
        icon: null,
        path: '/contabilidad/compras/facturas',
        order: 0,
      },
      {
        id: 'cont-fb-comp-reg',
        label: 'Registrar compra',
        icon: null,
        path: '/contabilidad/compras/registrar',
        order: 1,
      },
    ],
  },
  {
    id: 'cont-fb-vent',
    label: 'Ventas',
    icon: 'receipt',
    path: null,
    order: 4,
    children: [
      {
        id: 'cont-fb-vent-fac',
        label: 'Facturas de venta',
        icon: null,
        path: '/contabilidad/ventas/facturas',
        order: 0,
      },
      {
        id: 'cont-fb-vent-new',
        label: 'Nueva factura',
        icon: null,
        path: '/contabilidad/ventas/nueva-factura',
        order: 1,
      },
    ],
  },
  {
    id: 'cont-fb-bank',
    label: 'Bancos',
    icon: 'landmark',
    path: null,
    order: 5,
    children: [
      {
        id: 'cont-fb-bank-acc',
        label: 'Cuentas bancarias',
        icon: null,
        path: '/contabilidad/bancos/cuentas',
        order: 0,
      },
      {
        id: 'cont-fb-bank-mov',
        label: 'Movimientos',
        icon: null,
        path: '/contabilidad/bancos/movimientos',
        order: 1,
      },
      {
        id: 'cont-fb-bank-con',
        label: 'Conciliación',
        icon: null,
        path: '/contabilidad/bancos/conciliacion',
        order: 2,
      },
    ],
  },
  {
    id: 'cont-fb-caja',
    label: 'Caja',
    icon: 'wallet',
    path: null,
    order: 6,
    children: [
      {
        id: 'cont-fb-caja-ch',
        label: 'Caja chica',
        icon: null,
        path: '/contabilidad/caja/chica',
        order: 0,
      },
      {
        id: 'cont-fb-caja-mov',
        label: 'Movimientos',
        icon: null,
        path: '/contabilidad/caja/movimientos',
        order: 1,
      },
    ],
  },
  {
    id: 'cont-fb-imp',
    label: 'Impuestos',
    icon: 'percent',
    path: null,
    order: 7,
    children: [
      {
        id: 'cont-fb-imp-igv',
        label: 'IGV',
        icon: null,
        path: '/contabilidad/impuestos/igv',
        order: 0,
      },
      {
        id: 'cont-fb-imp-rent',
        label: 'Impuesto a la renta',
        icon: null,
        path: '/contabilidad/impuestos/renta',
        order: 1,
      },
      {
        id: 'cont-fb-imp-dec',
        label: 'Declaraciones',
        icon: null,
        path: '/contabilidad/impuestos/declaraciones',
        order: 2,
      },
    ],
  },
  {
    id: 'cont-fb-rep',
    label: 'Reportes',
    icon: 'pie-chart',
    path: null,
    order: 8,
    children: [
      {
        id: 'cont-fb-rep-bg',
        label: 'Balance general',
        icon: null,
        path: '/contabilidad/reportes/balance-general',
        order: 0,
      },
      {
        id: 'cont-fb-rep-er',
        label: 'Estado de resultados',
        icon: null,
        path: '/contabilidad/reportes/estado-resultados',
        order: 1,
      },
      {
        id: 'cont-fb-rep-lm',
        label: 'Libro mayor',
        icon: null,
        path: '/contabilidad/reportes/libro-mayor',
        order: 2,
      },
      {
        id: 'cont-fb-rep-fc',
        label: 'Flujo de caja',
        icon: null,
        path: '/contabilidad/reportes/flujo-caja',
        order: 3,
      },
    ],
  },
  {
    id: 'cont-fb-cfg',
    label: 'Configuración',
    icon: 'settings',
    path: '/contabilidad/configuracion',
    order: 9,
  },
]

export function contabilidadMenusLookComplete(apiMenus: MenuItem[]): boolean {
  if (!apiMenus.length) return false
  const plan = apiMenus.find((m) => m.label.trim() === 'Plan de cuentas')
  return !!(plan?.children && plan.children.length > 0)
}
