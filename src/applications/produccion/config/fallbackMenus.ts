import type { MenuItem } from '@shared/types'

/** Menú cuando la API no devuelve aún el árbol completo (sin seed). */
export const PRODUCCION_FALLBACK_MENUS: MenuItem[] = [
  {
    id: 'prod-fb-dashboard',
    label: 'Dashboard',
    icon: 'layout-dashboard',
    path: '/produccion',
    order: 0,
  },
  {
    id: 'prod-fb-ot',
    label: 'Órdenes de trabajo',
    icon: 'clipboard-list',
    path: null,
    order: 1,
    children: [
      {
        id: 'prod-fb-ot-list',
        label: 'Listado de órdenes',
        icon: null,
        path: '/produccion/ordenes-trabajo',
        order: 0,
      },
      {
        id: 'prod-fb-ot-new',
        label: 'Nueva orden',
        icon: null,
        path: '/produccion/ordenes-trabajo/nueva',
        order: 1,
      },
      {
        id: 'prod-fb-ot-run',
        label: 'En proceso',
        icon: null,
        path: '/produccion/ordenes-trabajo/en-proceso',
        order: 2,
      },
    ],
  },
  {
    id: 'prod-fb-productos',
    label: 'Productos',
    icon: 'boxes',
    path: null,
    order: 2,
    children: [
      {
        id: 'prod-fb-prod-cat',
        label: 'Catálogo',
        icon: null,
        path: '/produccion/productos',
        order: 0,
      },
      {
        id: 'prod-fb-prod-new',
        label: 'Nuevo producto',
        icon: null,
        path: '/produccion/productos/nuevo',
        order: 1,
      },
    ],
  },
  {
    id: 'prod-fb-inv',
    label: 'Inventario',
    icon: 'warehouse',
    path: null,
    order: 3,
    children: [
      {
        id: 'prod-fb-inv-mat',
        label: 'Materiales',
        icon: null,
        path: '/produccion/inventario/materiales',
        order: 0,
      },
      {
        id: 'prod-fb-inv-ins',
        label: 'Insumos',
        icon: null,
        path: '/produccion/inventario/insumos',
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
    id: 'prod-fb-prov',
    label: 'Proveedores',
    icon: 'truck',
    path: null,
    order: 4,
    children: [
      {
        id: 'prod-fb-prov-list',
        label: 'Listado',
        icon: null,
        path: '/produccion/proveedores',
        order: 0,
      },
      {
        id: 'prod-fb-prov-new',
        label: 'Nuevo proveedor',
        icon: null,
        path: '/produccion/proveedores/nuevo',
        order: 1,
      },
      {
        id: 'prod-fb-prov-oc',
        label: 'Órdenes de compra',
        icon: null,
        path: '/produccion/proveedores/ordenes-compra',
        order: 2,
      },
    ],
  },
  {
    id: 'prod-fb-etapas',
    label: 'Producción',
    icon: 'kanban',
    path: null,
    order: 5,
    children: [
      {
        id: 'prod-fb-eta-plan',
        label: 'Planificación',
        icon: null,
        path: '/produccion/etapas/planificacion',
        order: 0,
      },
      {
        id: 'prod-fb-eta-corte',
        label: 'Corte',
        icon: null,
        path: '/produccion/etapas/corte',
        order: 1,
      },
      {
        id: 'prod-fb-eta-ens',
        label: 'Ensamble',
        icon: null,
        path: '/produccion/etapas/ensamble',
        order: 2,
      },
      {
        id: 'prod-fb-eta-acab',
        label: 'Acabados',
        icon: null,
        path: '/produccion/etapas/acabados',
        order: 3,
      },
    ],
  },
  {
    id: 'prod-fb-rep',
    label: 'Reportes',
    icon: 'bar-chart',
    path: '/produccion/reportes',
    order: 6,
  },
  {
    id: 'prod-fb-cfg',
    label: 'Configuración',
    icon: 'settings',
    path: '/produccion/configuracion',
    order: 7,
  },
]

export function produccionMenusLookComplete(apiMenus: MenuItem[]): boolean {
  if (!apiMenus.length) return false
  const ot = apiMenus.find((m) =>
    /órdenes de trabajo|ordenes de trabajo/i.test(m.label.trim()),
  )
  return !!(ot?.children && ot.children.length > 0)
}
