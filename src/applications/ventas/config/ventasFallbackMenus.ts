import type { MenuItem } from '@shared/types'

/**
 * Menú lateral de Ventas cuando la API aún no devuelve filas (p. ej. sin seed de menús).
 * Debe mantenerse alineado con las rutas en `ventas/router` y con el seed del backend.
 */
export const VENTAS_FALLBACK_MENUS: MenuItem[] = [
  {
    id: 'ventas-fb-dashboard',
    label: 'Dashboard',
    icon: 'layout-dashboard',
    path: '/ventas',
    order: 0,
  },
  {
    id: 'ventas-fb-clientes',
    label: 'Clientes',
    icon: 'users',
    path: null,
    order: 1,
    children: [
      {
        id: 'ventas-fb-clientes-list',
        label: 'Listado de Clientes',
        icon: null,
        path: '/ventas/clientes',
        order: 0,
      },
      {
        id: 'ventas-fb-clientes-new',
        label: 'Nuevo Cliente',
        icon: null,
        path: '/ventas/clientes/nuevo',
        order: 1,
      },
    ],
  },
  {
    id: 'ventas-fb-propiedades',
    label: 'Propiedades',
    icon: 'building',
    path: null,
    order: 2,
    children: [
      {
        id: 'ventas-fb-prop-list',
        label: 'Listado de Propiedades',
        icon: null,
        path: '/ventas/propiedades',
        order: 0,
      },
      {
        id: 'ventas-fb-prop-new',
        label: 'Nueva Propiedad',
        icon: null,
        path: '/ventas/propiedades/nueva',
        order: 1,
      },
    ],
  },
  {
    id: 'ventas-fb-negociaciones',
    label: 'Negociaciones',
    icon: 'file-text',
    path: '/ventas/negociaciones',
    order: 3,
  },
  {
    id: 'ventas-fb-comisiones',
    label: 'Comisiones',
    icon: 'dollar-sign',
    path: '/ventas/comisiones',
    order: 4,
  },
  {
    id: 'ventas-fb-reportes',
    label: 'Reportes',
    icon: 'bar-chart',
    path: '/ventas/reportes',
    order: 5,
  },
  {
    id: 'ventas-fb-config',
    label: 'Configuración',
    icon: 'settings',
    path: '/ventas/configuracion',
    order: 6,
  },
]
