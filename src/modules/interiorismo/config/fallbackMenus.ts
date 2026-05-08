import type { MenuItem } from '@shared/domain/menu.types'

/**
 * Menú lateral de Interiorismo cuando la API aún no tiene el árbol (sin seed / datos viejos).
 * Debe mantenerse alineado con `prisma/seed/data/menus-interiorismo.ts` y el router.
 */
export const INTERIORISMO_FALLBACK_MENUS: MenuItem[] = [
  {
    id: 'int-fb-dashboard',
    label: 'Dashboard',
    icon: 'layout-dashboard',
    path: '/interiorismo',
    order: 0,
  },
  {
    id: 'int-fb-proyectos',
    label: 'Proyectos',
    icon: 'folder-kanban',
    path: null,
    order: 1,
    children: [
      {
        id: 'int-fb-proy-list',
        label: 'Listado de proyectos',
        icon: null,
        path: '/interiorismo/proyectos',
        order: 0,
      },
      {
        id: 'int-fb-proy-new',
        label: 'Nuevo proyecto',
        icon: null,
        path: '/interiorismo/proyectos/nuevo',
        order: 1,
      },
      {
        id: 'int-fb-proy-progress',
        label: 'En progreso',
        icon: null,
        path: '/interiorismo/proyectos/en-progreso',
        order: 2,
      },
    ],
  },
  {
    id: 'int-fb-clientes',
    label: 'Clientes',
    icon: 'users',
    path: null,
    order: 2,
    children: [
      {
        id: 'int-fb-cli-list',
        label: 'Listado de clientes',
        icon: null,
        path: '/interiorismo/clientes',
        order: 0,
      },
      {
        id: 'int-fb-cli-new',
        label: 'Nuevo cliente',
        icon: null,
        path: '/interiorismo/clientes/nuevo',
        order: 1,
      },
    ],
  },
  {
    id: 'int-fb-presupuestos',
    label: 'Presupuestos',
    icon: 'file-text',
    path: null,
    order: 3,
    children: [
      {
        id: 'int-fb-pre-list',
        label: 'Listado',
        icon: null,
        path: '/interiorismo/presupuestos',
        order: 0,
      },
      {
        id: 'int-fb-pre-new',
        label: 'Nuevo presupuesto',
        icon: null,
        path: '/interiorismo/presupuestos/nuevo',
        order: 1,
      },
    ],
  },
  {
    id: 'int-fb-materiales',
    label: 'Materiales',
    icon: 'layers',
    path: null,
    order: 4,
    children: [
      {
        id: 'int-fb-mat-cat',
        label: 'Catálogo',
        icon: null,
        path: '/interiorismo/materiales/catalogo',
        order: 0,
      },
      {
        id: 'int-fb-mat-prov',
        label: 'Proveedores',
        icon: null,
        path: '/interiorismo/materiales/proveedores',
        order: 1,
      },
    ],
  },
  {
    id: 'int-fb-ejecucion',
    label: 'Ejecución',
    icon: 'flame',
    path: '/interiorismo/ejecucion',
    order: 5,
  },
  {
    id: 'int-fb-finanzas',
    label: 'Finanzas',
    icon: 'wallet',
    path: '/interiorismo/finanzas',
    order: 6,
  },
  {
    id: 'int-fb-calendario',
    label: 'Calendario',
    icon: 'calendar',
    path: '/interiorismo/calendario',
    order: 7,
  },
  {
    id: 'int-fb-documentos',
    label: 'Documentos',
    icon: 'files',
    path: null,
    order: 8,
    children: [
      {
        id: 'int-fb-doc-contratos',
        label: 'Contratos',
        icon: null,
        path: '/interiorismo/documentos/contratos',
        order: 0,
      },
      {
        id: 'int-fb-doc-pdfs',
        label: 'PDFs',
        icon: null,
        path: '/interiorismo/documentos/pdfs',
        order: 1,
      },
      {
        id: 'int-fb-doc-render',
        label: 'Renderizados',
        icon: null,
        path: '/interiorismo/documentos/renderizados',
        order: 2,
      },
      {
        id: 'int-fb-doc-planos',
        label: 'Planos',
        icon: null,
        path: '/interiorismo/documentos/planos',
        order: 3,
      },
      {
        id: 'int-fb-doc-facturas',
        label: 'Facturas',
        icon: null,
        path: '/interiorismo/documentos/facturas',
        order: 4,
      },
      {
        id: 'int-fb-doc-actas',
        label: 'Actas',
        icon: null,
        path: '/interiorismo/documentos/actas',
        order: 5,
      },
    ],
  },
  {
    id: 'int-fb-config',
    label: 'Configuración',
    icon: 'settings',
    path: '/interiorismo/configuracion',
    order: 9,
  },
  {
    id: 'int-fb-reportes',
    label: 'Reportes',
    icon: 'bar-chart',
    path: '/interiorismo/reportes',
    order: 10,
  },
]

/** El árbol de la API incluye submenús de Proyectos y Documentos (criterio seed / datos completos). */
export function interiorismoMenusLookComplete(apiMenus: MenuItem[]): boolean {
  if (!apiMenus.length) return false
  const proyectos = apiMenus.find((m) => m.label.trim() === 'Proyectos')
  const documentos = apiMenus.find((m) => m.label.trim() === 'Documentos')
  return !!(
    proyectos?.children?.length &&
    documentos?.children?.length
  )
}
