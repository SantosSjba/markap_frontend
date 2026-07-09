import type { MenuItem } from '@shared/domain/menu.types'

/**
 * Menú lateral HITO Arquitectura cuando la API aún no tiene el árbol completo.
 * Alineado con `prisma/seed/data/menus-arquitectura.ts` y el router.
 *
 * Flujo: Cliente → Proyecto → Presupuesto → Cronograma → Documentos → Reportes → Config
 */
export const ARQUITECTURA_FALLBACK_MENUS: MenuItem[] = [
  {
    id: 'arq-fb-dashboard',
    label: 'Dashboard',
    icon: 'layout-dashboard',
    path: '/arquitectura',
    order: 0,
  },
  {
    id: 'arq-fb-clientes',
    label: 'Clientes',
    icon: 'users',
    path: null,
    order: 1,
    children: [
      {
        id: 'arq-fb-cli-list',
        label: 'Listado de clientes',
        icon: null,
        path: '/arquitectura/clientes',
        order: 0,
      },
      {
        id: 'arq-fb-cli-new',
        label: 'Nuevo cliente',
        icon: null,
        path: '/arquitectura/clientes/nuevo',
        order: 1,
      },
    ],
  },
  {
    id: 'arq-fb-proyectos',
    label: 'Proyectos',
    icon: 'folder-kanban',
    path: null,
    order: 2,
    children: [
      {
        id: 'arq-fb-proy-list',
        label: 'Listado de proyectos',
        icon: null,
        path: '/arquitectura/proyectos',
        order: 0,
      },
      {
        id: 'arq-fb-proy-new',
        label: 'Nuevo proyecto',
        icon: null,
        path: '/arquitectura/proyectos/nuevo',
        order: 1,
      },
      {
        id: 'arq-fb-proy-run',
        label: 'En ejecución',
        icon: null,
        path: '/arquitectura/proyectos/en-ejecucion',
        order: 2,
      },
    ],
  },
  {
    id: 'arq-fb-presupuestos',
    label: 'Presupuestos',
    icon: 'file-text',
    path: null,
    order: 3,
    children: [
      {
        id: 'arq-fb-pre-list',
        label: 'Listado',
        icon: null,
        path: '/arquitectura/presupuestos',
        order: 0,
      },
      {
        id: 'arq-fb-pre-new',
        label: 'Nuevo presupuesto',
        icon: null,
        path: '/arquitectura/presupuestos/nuevo',
        order: 1,
      },
    ],
  },
  {
    id: 'arq-fb-cronograma',
    label: 'Cronograma',
    icon: 'calendar-range',
    path: '/arquitectura/cronograma',
    order: 4,
  },
  {
    id: 'arq-fb-documentos',
    label: 'Documentos',
    icon: 'files',
    path: null,
    order: 5,
    children: [
      { id: 'arq-fb-doc-contratos', label: 'Contratos', icon: null, path: '/arquitectura/documentos/contratos', order: 0 },
      { id: 'arq-fb-doc-planos', label: 'Planos', icon: null, path: '/arquitectura/documentos/planos', order: 1 },
      { id: 'arq-fb-doc-renders', label: 'Renders', icon: null, path: '/arquitectura/documentos/renders', order: 2 },
      {
        id: 'arq-fb-doc-memoria',
        label: 'Memoria descriptiva',
        icon: null,
        path: '/arquitectura/documentos/memoria-descriptiva',
        order: 3,
      },
      { id: 'arq-fb-doc-facturas', label: 'Facturas', icon: null, path: '/arquitectura/documentos/facturas', order: 4 },
      { id: 'arq-fb-doc-actas', label: 'Actas', icon: null, path: '/arquitectura/documentos/actas', order: 5 },
    ],
  },
  {
    id: 'arq-fb-ejecucion',
    label: 'Ejecución',
    icon: 'hard-hat',
    path: '/arquitectura/ejecucion',
    order: 6,
  },
  {
    id: 'arq-fb-reportes',
    label: 'Reportes',
    icon: 'bar-chart',
    path: '/arquitectura/reportes',
    order: 7,
  },
  {
    id: 'arq-fb-config',
    label: 'Configuración',
    icon: 'settings',
    path: '/arquitectura/configuracion',
    order: 8,
  },
]

export function arquitecturaMenusLookComplete(apiMenus: MenuItem[]): boolean {
  if (!apiMenus.length) return false
  const proyectos = apiMenus.find((m) => m.label.trim() === 'Proyectos')
  const presupuestos = apiMenus.find((m) => m.label.trim() === 'Presupuestos')
  return !!(
    proyectos?.children?.length &&
    presupuestos?.children?.length
  )
}
