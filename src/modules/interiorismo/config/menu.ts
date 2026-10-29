import type { MenuItem } from '@shared/domain/menu.types'
/**
 * Menú lateral de Interiorismo (estático, versionado junto al router).
 * Para agregar o quitar una opción: editar este archivo y la ruta correspondiente.
 */
export const INTERIORISMO_MENUS: MenuItem[] = [
  {
    id: 'interiorismo-dashboard',
    label: 'Dashboard',
    icon: 'layout-dashboard',
    path: '/interiorismo',
    order: 0,
  },
  {
    id: 'interiorismo-clientes',
    label: 'Clientes',
    icon: 'users',
    path: null,
    order: 1,
    children: [
      {
        id: 'interiorismo-clientes-listado-de-clientes',
        label: 'Listado de clientes',
        icon: null,
        path: '/interiorismo/clientes',
        order: 0,
      },
      {
        id: 'interiorismo-clientes-nuevo-cliente',
        label: 'Nuevo cliente',
        icon: null,
        path: '/interiorismo/clientes/nuevo',
        order: 1,
      },
    ],
  },
  {
    id: 'interiorismo-materiales',
    label: 'Catálogo y proveedores',
    icon: 'layers',
    path: null,
    order: 2,
    children: [
      {
        id: 'interiorismo-materiales-catalogo',
        label: 'Materiales y productos',
        icon: null,
        path: '/interiorismo/materiales/catalogo',
        order: 0,
      },
      {
        id: 'interiorismo-materiales-proveedores',
        label: 'Proveedores',
        icon: null,
        path: '/interiorismo/materiales/proveedores',
        order: 1,
      },
    ],
  },
  {
    id: 'interiorismo-equipo',
    label: 'Equipo',
    icon: 'hard-hat',
    path: '/interiorismo/equipo',
    order: 3,
  },
  {
    id: 'interiorismo-proyectos',
    label: 'Proyectos',
    icon: 'folder-kanban',
    path: null,
    order: 4,
    children: [
      {
        id: 'interiorismo-proyectos-listado-de-proyectos',
        label: 'Listado de proyectos',
        icon: null,
        path: '/interiorismo/proyectos',
        order: 0,
      },
      {
        id: 'interiorismo-proyectos-nuevo-proyecto',
        label: 'Nuevo proyecto',
        icon: null,
        path: '/interiorismo/proyectos/nuevo',
        order: 1,
      },
    ],
  },
  {
    id: 'interiorismo-calendario',
    label: 'Calendario',
    icon: 'calendar',
    path: '/interiorismo/calendario',
    order: 5,
  },
  {
    id: 'interiorismo-documentos',
    label: 'Documentos',
    icon: 'files',
    path: '/interiorismo/documentos',
    order: 6,
  },
  {
    id: 'interiorismo-reportes',
    label: 'Reportes',
    icon: 'bar-chart',
    path: '/interiorismo/reportes',
    order: 7,
  },
  {
    id: 'interiorismo-configuracion',
    label: 'Configuración',
    icon: 'settings',
    path: '/interiorismo/configuracion',
    order: 8,
  },
]
