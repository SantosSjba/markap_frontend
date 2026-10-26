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
    id: 'interiorismo-proyectos',
    label: 'Proyectos',
    icon: 'folder-kanban',
    path: null,
    order: 2,
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
      {
        id: 'interiorismo-proyectos-en-progreso',
        label: 'En progreso',
        icon: null,
        path: '/interiorismo/proyectos/en-progreso',
        order: 2,
      },
    ],
  },
  {
    id: 'interiorismo-materiales',
    label: 'Materiales',
    icon: 'layers',
    path: null,
    order: 3,
    children: [
      {
        id: 'interiorismo-materiales-catalogo',
        label: 'Catálogo',
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
    id: 'interiorismo-ejecucion',
    label: 'Ejecución',
    icon: 'flame',
    path: '/interiorismo/ejecucion',
    order: 4,
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
    path: null,
    order: 6,
    children: [
      {
        id: 'interiorismo-documentos-contratos',
        label: 'Contratos',
        icon: null,
        path: '/interiorismo/documentos/contratos',
        order: 0,
      },
      {
        id: 'interiorismo-documentos-planos',
        label: 'Planos',
        icon: null,
        path: '/interiorismo/documentos/planos',
        order: 1,
      },
      {
        id: 'interiorismo-documentos-renderizados',
        label: 'Renderizados',
        icon: null,
        path: '/interiorismo/documentos/renderizados',
        order: 2,
      },
      {
        id: 'interiorismo-documentos-pdfs',
        label: 'PDFs',
        icon: null,
        path: '/interiorismo/documentos/pdfs',
        order: 3,
      },
      {
        id: 'interiorismo-documentos-facturas',
        label: 'Facturas',
        icon: null,
        path: '/interiorismo/documentos/facturas',
        order: 4,
      },
      {
        id: 'interiorismo-documentos-actas',
        label: 'Actas',
        icon: null,
        path: '/interiorismo/documentos/actas',
        order: 5,
      },
    ],
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
