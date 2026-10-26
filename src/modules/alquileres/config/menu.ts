import type { MenuItem } from '@shared/domain/menu.types'
/**
 * Menú lateral de Alquileres (estático, versionado junto al router).
 * Para agregar o quitar una opción: editar este archivo y la ruta correspondiente.
 */
export const ALQUILERES_MENUS: MenuItem[] = [
  {
    id: 'alquileres-dashboard',
    label: 'Dashboard',
    icon: 'layout-dashboard',
    path: '/alquileres',
    order: 0,
  },
  {
    id: 'alquileres-clientes',
    label: 'Clientes',
    icon: 'users',
    path: '/alquileres/clientes',
    order: 1,
    children: [
      {
        id: 'alquileres-clientes-listado-de-clientes',
        label: 'Listado de Clientes',
        icon: null,
        path: '/alquileres/clientes',
        order: 0,
      },
      {
        id: 'alquileres-clientes-nuevo-cliente',
        label: 'Nuevo Cliente',
        icon: null,
        path: '/alquileres/clientes/nuevo',
        order: 1,
      },
    ],
  },
  {
    id: 'alquileres-propiedades',
    label: 'Propiedades',
    icon: 'building',
    path: null,
    order: 2,
    children: [
      {
        id: 'alquileres-propiedades-listado-de-propiedades',
        label: 'Listado de Propiedades',
        icon: null,
        path: '/alquileres/propiedades',
        order: 0,
      },
      {
        id: 'alquileres-propiedades-nueva-propiedad',
        label: 'Nueva Propiedad',
        icon: null,
        path: '/alquileres/propiedades/nueva',
        order: 1,
      },
    ],
  },
  {
    id: 'alquileres-agentes',
    label: 'Agentes',
    icon: 'user-check',
    path: '/alquileres/agentes',
    order: 3,
    children: [
      {
        id: 'alquileres-agentes-listado-de-agentes',
        label: 'Listado de Agentes',
        icon: null,
        path: '/alquileres/agentes',
        order: 0,
      },
      {
        id: 'alquileres-agentes-nuevo-agente',
        label: 'Nuevo Agente',
        icon: null,
        path: '/alquileres/agentes/nuevo',
        order: 1,
      },
    ],
  },
  {
    id: 'alquileres-alquileres',
    label: 'Alquileres',
    icon: 'file-text',
    path: '/alquileres/contratos',
    order: 4,
    children: [
      {
        id: 'alquileres-alquileres-listado-de-alquileres',
        label: 'Listado de Alquileres',
        icon: null,
        path: '/alquileres/contratos',
        order: 0,
      },
      {
        id: 'alquileres-alquileres-nuevo-alquiler',
        label: 'Nuevo Alquiler',
        icon: null,
        path: '/alquileres/contratos/nuevo',
        order: 1,
      },
    ],
  },
  {
    id: 'alquileres-cobranzas',
    label: 'Cobranzas',
    icon: 'credit-card',
    path: '/alquileres/cobranzas',
    order: 5,
    children: [
      {
        id: 'alquileres-cobranzas-pagos-pendientes',
        label: 'Pagos Pendientes',
        icon: null,
        path: '/alquileres/cobranzas',
        order: 0,
      },
      {
        id: 'alquileres-cobranzas-historial-de-pagos',
        label: 'Historial de Pagos',
        icon: null,
        path: '/alquileres/cobranzas/historial',
        order: 1,
      },
      {
        id: 'alquileres-cobranzas-con-atraso',
        label: 'Con Atraso',
        icon: null,
        path: '/alquileres/cobranzas/atrasos',
        order: 2,
      },
    ],
  },
  {
    id: 'alquileres-reportes',
    label: 'Reportes',
    icon: 'bar-chart',
    path: '/alquileres/reportes',
    order: 6,
  },
  {
    id: 'alquileres-configuracion',
    label: 'Configuración',
    icon: 'settings',
    path: '/alquileres/configuracion',
    order: 7,
  },
]
