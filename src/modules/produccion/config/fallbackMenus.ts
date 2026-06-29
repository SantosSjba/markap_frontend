import type { MenuItem } from '@shared/domain/menu.types'

/**
 * Menú alineado al flujo operativo (fallback si la API no responde).
 * Cliente → Catálogo → Costos → Compras → Inventario → Producción → Ventas → Reportes
 */
export const PRODUCCION_FALLBACK_MENUS: MenuItem[] = [
  {
    id: 'prod-fb-dashboard',
    label: 'Dashboard',
    icon: 'layout-dashboard',
    path: '/produccion',
    order: 0,
  },
  {
    id: 'prod-fb-clientes',
    label: 'Clientes',
    icon: 'users',
    path: null,
    order: 1,
    children: [
      {
        id: 'prod-fb-cli-list',
        label: 'Listado de clientes',
        icon: null,
        path: '/produccion/clientes',
        order: 0,
      },
      {
        id: 'prod-fb-cli-new',
        label: 'Nuevo cliente',
        icon: null,
        path: '/produccion/clientes/nuevo',
        order: 1,
      },
    ],
  },
  {
    id: 'prod-fb-catalogo',
    label: 'Catálogo de muebles',
    icon: 'boxes',
    path: null,
    order: 2,
    children: [
      {
        id: 'prod-fb-cat-list',
        label: 'Catálogo',
        icon: null,
        path: '/produccion/catalogo',
        order: 0,
      },
      {
        id: 'prod-fb-cat-new',
        label: 'Nuevo mueble',
        icon: null,
        path: '/produccion/catalogo/nuevo',
        order: 1,
      },
    ],
  },
  {
    id: 'prod-fb-costos',
    label: 'Costos',
    icon: 'calculator',
    path: null,
    order: 3,
    children: [
      {
        id: 'prod-fb-cost-costeo',
        label: 'Costeo de muebles',
        icon: null,
        path: '/produccion/costos/costeo',
        order: 0,
      },
      {
        id: 'prod-fb-cost-mo',
        label: 'Mano de obra',
        icon: null,
        path: '/produccion/costos/mano-obra',
        order: 1,
      },
      {
        id: 'prod-fb-cost-gastos',
        label: 'Gastos adicionales',
        icon: null,
        path: '/produccion/costos/gastos',
        order: 2,
      },
    ],
  },
  {
    id: 'prod-fb-compras',
    label: 'Compras',
    icon: 'shopping-cart',
    path: null,
    order: 4,
    children: [
      {
        id: 'prod-fb-comp-prov',
        label: 'Proveedores',
        icon: null,
        path: '/produccion/compras/proveedores',
        order: 0,
      },
      {
        id: 'prod-fb-comp-oc',
        label: 'Órdenes de compra',
        icon: null,
        path: '/produccion/compras/ordenes-compra',
        order: 1,
      },
    ],
  },
  {
    id: 'prod-fb-inv',
    label: 'Inventario',
    icon: 'warehouse',
    path: null,
    order: 5,
    children: [
      {
        id: 'prod-fb-inv-mat',
        label: 'Materiales',
        icon: null,
        path: '/produccion/inventario/materiales',
        order: 0,
      },
      {
        id: 'prod-fb-inv-stock',
        label: 'Stock',
        icon: null,
        path: '/produccion/inventario/stock',
        order: 1,
      },
      {
        id: 'prod-fb-inv-mov',
        label: 'Movimientos',
        icon: null,
        path: '/produccion/inventario/movimientos',
        order: 2,
      },
    ],
  },
  {
    id: 'prod-fb-produccion',
    label: 'Producción',
    icon: 'kanban',
    path: null,
    order: 6,
    children: [
      {
        id: 'prod-fb-prod-ot',
        label: 'Órdenes de trabajo',
        icon: null,
        path: '/produccion/ordenes-trabajo',
        order: 0,
      },
      {
        id: 'prod-fb-prod-proc',
        label: 'Producción en proceso',
        icon: null,
        path: '/produccion/produccion/en-proceso',
        order: 1,
      },
      {
        id: 'prod-fb-prod-etapas',
        label: 'Etapas de producción',
        icon: null,
        path: '/produccion/produccion/etapas',
        order: 2,
      },
      {
        id: 'prod-fb-prod-term',
        label: 'Productos terminados',
        icon: null,
        path: '/produccion/produccion/terminados',
        order: 3,
      },
    ],
  },
  {
    id: 'prod-fb-ventas',
    label: 'Ventas',
    icon: 'receipt',
    path: null,
    order: 7,
    children: [
      {
        id: 'prod-fb-vent-cot',
        label: 'Cotizaciones',
        icon: null,
        path: '/produccion/ventas/cotizaciones',
        order: 0,
      },
      {
        id: 'prod-fb-vent-ped',
        label: 'Pedidos',
        icon: null,
        path: '/produccion/ventas/pedidos',
        order: 1,
      },
      {
        id: 'prod-fb-vent-ent',
        label: 'Entregas',
        icon: null,
        path: '/produccion/ventas/entregas',
        order: 2,
      },
    ],
  },
  {
    id: 'prod-fb-rep',
    label: 'Reportes',
    icon: 'bar-chart',
    path: '/produccion/reportes',
    order: 8,
  },
  {
    id: 'prod-fb-cfg',
    label: 'Configuración',
    icon: 'settings',
    path: '/produccion/configuracion',
    order: 9,
  },
]

export function produccionMenusLookComplete(apiMenus: MenuItem[]): boolean {
  if (!apiMenus.length) return false
  const clientes = apiMenus.find((m) => m.label.trim() === 'Clientes')
  const compras = apiMenus.find((m) => m.label.trim() === 'Compras')
  return !!(clientes?.children?.length && compras?.children?.length)
}
