import type { ActionItem } from '@shared/presentation/components/ui/ActionsDropdown.vue'
import type {
  BudgetIgvMode,
  BudgetMarginMode,
  BudgetRowStatus,
  BudgetSheetRowDto,
} from '../../../domain/project-budget.types'

/** Columnas de la hoja (además de la descripción, que siempre se ve). */
export type SheetColumnKey =
  | 'code'
  | 'unit'
  | 'quantity'
  | 'unitPrice'
  | 'cost'
  | 'actualCost'
  | 'utilityPct'
  | 'igv'
  | 'price'
  | 'status'
  | 'note'

export interface SheetColumn {
  key: SheetColumnKey
  label: string
  /** Ancho fijo de la columna (clase Tailwind) */
  width: string
  align: 'left' | 'right' | 'center'
  hint?: string
}

export const SHEET_COLUMNS: SheetColumn[] = [
  { key: 'code', label: 'Ítem', width: 'w-20', align: 'left' },
  { key: 'unit', label: 'Und', width: 'w-16', align: 'left' },
  { key: 'quantity', label: 'Metrado', width: 'w-24', align: 'right' },
  { key: 'unitPrice', label: 'P.U.', width: 'w-28', align: 'right' },
  { key: 'cost', label: 'Costo', width: 'w-32', align: 'right', hint: 'Metrado × P.U. o el monto que escriba' },
  { key: 'actualCost', label: 'Costo real', width: 'w-32', align: 'right' },
  { key: 'utilityPct', label: 'Util. %', width: 'w-20', align: 'right' },
  { key: 'igv', label: 'IGV', width: 'w-28', align: 'right' },
  { key: 'price', label: 'Precio', width: 'w-32', align: 'right' },
  { key: 'status', label: 'Estado', width: 'w-32', align: 'left' },
  { key: 'note', label: 'Nota', width: 'w-48', align: 'left' },
]

/** Columnas que tienen sentido según cómo se calcula el margen y el IGV */
export function availableColumns(marginMode: BudgetMarginMode, igvMode: BudgetIgvMode): SheetColumnKey[] {
  return SHEET_COLUMNS.map((c) => c.key).filter((key) => {
    if (marginMode === 'GLOBAL' && (key === 'utilityPct' || key === 'price')) return false
    if (key === 'igv' && igvMode !== 'PER_LINE') return false
    return true
  })
}

/** Por defecto: utilidad por línea → como Markap Spaces; global → como PRIZE */
export function defaultColumns(marginMode: BudgetMarginMode, igvMode: BudgetIgvMode): SheetColumnKey[] {
  const base: SheetColumnKey[] =
    marginMode === 'GLOBAL'
      ? ['code', 'unit', 'quantity', 'unitPrice', 'cost', 'actualCost', 'status']
      : ['code', 'cost', 'actualCost', 'utilityPct', 'igv', 'price', 'status']
  const allowed = availableColumns(marginMode, igvMode)
  return base.filter((k) => allowed.includes(k))
}

export const ROW_STATUS_OPTIONS: { value: BudgetRowStatus; label: string }[] = [
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'QUOTED', label: 'Cotizado' },
  { value: 'PURCHASED', label: 'Comprado' },
  { value: 'GIFT', label: 'Obsequio' },
]

/** Acciones del menú de cada fila */
export type RowAction =
  | 'fromCatalog'
  | 'addItem'
  | 'addGroup'
  | 'addSubgroup'
  | 'addNote'
  | 'toItem'
  | 'toGroup'
  | 'toNote'
  | 'up'
  | 'down'
  | 'indent'
  | 'outdent'
  | 'duplicate'
  | 'delete'

/**
 * Menú de una fila, en bloques: agregar, convertir, mover y eliminar. Lo comparten el botón «⋯»
 * y el clic derecho, así ambos ofrecen siempre lo mismo.
 */
export function rowActions(row: BudgetSheetRowDto, run: (action: RowAction) => void): ActionItem[] {
  const isGroup = row.kind === 'GROUP'
  const items: ActionItem[] = []
  const add = (label: string, icon: string, action: RowAction, extra: Partial<ActionItem> = {}) =>
    items.push({ label, icon, onClick: () => run(action), ...extra })

  add(isGroup ? 'Agregar partida dentro' : 'Agregar partida debajo', 'lucide:plus', 'addItem')
  if (isGroup) add('Agregar subgrupo dentro', 'lucide:folder-tree', 'addSubgroup')
  add(isGroup ? 'Agregar grupo debajo' : 'Agregar grupo', 'lucide:folder-plus', 'addGroup')
  add('Agregar nota', 'lucide:sticky-note', 'addNote')
  add('Agregar desde catálogo', 'lucide:book-open', 'fromCatalog')

  const convert: [RowAction, string, string][] = [
    ['toItem', 'Convertir en partida', 'lucide:list'],
    ['toGroup', 'Convertir en grupo', 'lucide:folder'],
    ['toNote', 'Convertir en nota', 'lucide:type'],
  ]
  convert
    .filter(([action]) =>
      action === 'toItem' ? row.kind !== 'ITEM' : action === 'toGroup' ? !isGroup : row.kind === 'ITEM',
    )
    .forEach(([action, label, icon], i) => add(label, icon, action, { separator: i === 0 }))

  add('Subir', 'lucide:arrow-up', 'up', { separator: true })
  add('Bajar', 'lucide:arrow-down', 'down')
  add('Meter en el grupo de arriba (Tab)', 'lucide:indent-increase', 'indent')
  if (row.parentId) add('Sacar del grupo (Shift+Tab)', 'lucide:indent-decrease', 'outdent')

  if (!isGroup) add('Duplicar', 'lucide:copy', 'duplicate', { separator: true })
  add(isGroup ? 'Eliminar grupo' : 'Eliminar', 'lucide:trash-2', 'delete', { danger: true, separator: isGroup })
  return items
}
