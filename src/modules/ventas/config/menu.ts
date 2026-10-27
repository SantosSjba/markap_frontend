import type { MenuItem } from '@shared/domain/menu.types'
/**
 * Menú lateral de Ventas (estático, versionado junto al router).
 * Para agregar o quitar una opción: editar este archivo y la ruta correspondiente.
 */
export const VENTAS_MENUS: MenuItem[] = [
  {
    id: 'ventas-dashboard',
    label: 'Dashboard',
    icon: 'layout-dashboard',
    path: '/ventas',
    order: 0,
  },
  {
    id: 'ventas-clientes',
    label: 'Clientes',
    icon: 'users',
    path: null,
    order: 1,
    children: [
      {
        id: 'ventas-clientes-listado-de-clientes',
        label: 'Listado de Clientes',
        icon: null,
        path: '/ventas/clientes',
        order: 0,
      },
      {
        id: 'ventas-clientes-nuevo-cliente',
        label: 'Nuevo Cliente',
        icon: null,
        path: '/ventas/clientes/nuevo',
        order: 1,
      },
    ],
  },
  {
    id: 'ventas-propiedades',
    label: 'Propiedades',
    icon: 'building',
    path: null,
    order: 2,
    children: [
      {
        id: 'ventas-propiedades-listado-de-propiedades',
        label: 'Listado de Propiedades',
        icon: null,
        path: '/ventas/propiedades',
        order: 0,
      },
      {
        id: 'ventas-propiedades-nueva-propiedad',
        label: 'Nueva Propiedad',
        icon: null,
        path: '/ventas/propiedades/nueva',
        order: 1,
      },
    ],
  },
  {
    id: 'ventas-agentes',
    label: 'Agentes',
    icon: 'user-check',
    path: null,
    order: 3,
    children: [
      {
        id: 'ventas-agentes-listado-de-agentes',
        label: 'Listado de Agentes',
        icon: null,
        path: '/ventas/agentes',
        order: 0,
      },
      {
        id: 'ventas-agentes-nuevo-agente',
        label: 'Nuevo Agente',
        icon: null,
        path: '/ventas/agentes/nuevo',
        order: 1,
      },
    ],
  },
  {
    id: 'ventas-ventas',
    label: 'Ventas',
    icon: 'file-text',
    path: null,
    order: 4,
    children: [
      {
        id: 'ventas-ventas-procesos-de-venta',
        label: 'Procesos de Venta',
        icon: null,
        path: '/ventas/procesos',
        order: 0,
      },
      {
        id: 'ventas-ventas-separaciones',
        label: 'Separaciones',
        icon: null,
        path: '/ventas/separaciones',
        order: 1,
      },
      {
        id: 'ventas-ventas-cierres',
        label: 'Cierres',
        icon: null,
        path: '/ventas/cierres',
        order: 2,
      },
      {
        id: 'ventas-ventas-comisiones',
        label: 'Comisiones',
        icon: null,
        path: '/ventas/comisiones',
        order: 3,
      },
    ],
  },
  {
    id: 'ventas-reportes',
    label: 'Reportes',
    icon: 'bar-chart',
    path: '/ventas/reportes',
    order: 5,
  },
  {
    id: 'ventas-configuracion',
    label: 'Configuración',
    icon: 'settings',
    path: '/ventas/configuracion',
    order: 6,
  },
]
