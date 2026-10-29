<script setup lang="ts">
import { computed, nextTick, ref, toRef, watch } from 'vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import BaseModal from '@shared/presentation/components/ui/BaseModal.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import FormCheckbox from '@shared/presentation/components/forms/FormCheckbox.vue'
import ContextMenuActions from '@shared/presentation/components/ui/ContextMenuActions.vue'
import HelpTooltip from '@shared/presentation/components/ui/HelpTooltip.vue'
import { isWithin, parsePastedRows, type DropZone } from '../../../domain/budget-sheet-editing'
import type { BudgetRowKind, BudgetSheetDto, BudgetSheetRowDto } from '../../../domain/project-budget.types'
import { useBudgetSheet } from '../../composables/useBudgetSheet'
import {
  useActivateBudgetVersion,
  useDuplicateBudgetSnapshot,
  useExportBudgetExcel,
  useOpenProjectBudgetPdf,
  useSyncBudgetFromExecution,
} from '../../composables/useProjectBudget'
import BudgetCatalogItemModal from './BudgetCatalogItemModal.vue'
import type { CreateBudgetRowsPayload } from '../../../domain/project-budget.types'
import BudgetHeaderBar from './BudgetHeaderBar.vue'
import BudgetImportModal from './BudgetImportModal.vue'
import BudgetSheetRow from './BudgetSheetRow.vue'
import BudgetTotalsBar from './BudgetTotalsBar.vue'
import {
  SHEET_COLUMNS,
  availableColumns,
  defaultColumns,
  rowActions,
  type RowAction,
  type SheetColumnKey,
} from './budget-sheet-columns'
/**
 * BudgetSheet — presupuesto tipo hoja, como en Excel: filas en árbol (niveles, ambientes,
 * categorías, partidas), edición en la celda, Enter para la fila siguiente, Tab / Shift+Tab para
 * meter o sacar de un grupo, ↑/↓ para moverse y pegar varias filas copiadas de Excel.
 * Las filas se arrastran por su asa (antes/después de otra fila o dentro de un grupo) y el
 * clic derecho abre el mismo menú que «⋯».
 */

const props = defineProps<{ projectId: string; sheet: BudgetSheetDto; canWrite: boolean }>()

const sheetRef = toRef(props, 'sheet')
const projectIdRef = toRef(props, 'projectId')
const editor = useBudgetSheet(projectIdRef, sheetRef)
const header = computed(() => props.sheet.budget)

// ── Columnas visibles ──
const allowedColumns = computed(() => availableColumns(header.value.marginMode, header.value.igvMode))
const columns = computed<SheetColumnKey[]>(() => {
  const saved = header.value.visibleColumns as SheetColumnKey[] | null
  const base = saved?.length ? saved : defaultColumns(header.value.marginMode, header.value.igvMode)
  return SHEET_COLUMNS.map((c) => c.key).filter((k) => base.includes(k) && allowedColumns.value.includes(k))
})
const headCells = computed(() => [
  ...(columns.value.includes('code') ? [SHEET_COLUMNS[0]!] : []),
  { key: 'description', label: 'Descripción', width: '', align: 'left' as const },
  ...SHEET_COLUMNS.filter((c) => c.key !== 'code' && columns.value.includes(c.key)),
])

const columnsOpen = ref(false)
const columnsDraft = ref<SheetColumnKey[]>([])
watch(columnsOpen, (o) => {
  if (o) columnsDraft.value = [...columns.value]
})
function toggleColumn(key: SheetColumnKey, on: boolean) {
  columnsDraft.value = on ? [...columnsDraft.value, key] : columnsDraft.value.filter((k) => k !== key)
}
function saveColumns() {
  void editor.updateHeader({ visibleColumns: columnsDraft.value })
  columnsOpen.value = false
}

// ── Foco ──
const table = ref<HTMLTableElement | null>(null)
async function focusCell(rowId: string | null, col = 'description') {
  if (!rowId) return
  await nextTick()
  const el =
    table.value?.querySelector<HTMLElement>(`[data-row="${rowId}"][data-col="${col}"]`) ??
    table.value?.querySelector<HTMLElement>(`[data-row="${rowId}"][data-col="description"]`)
  el?.focus()
}

// ── Teclado y pegado ──
async function onEnter(row: BudgetSheetRowDto) {
  await focusCell(await editor.addRow(row.id, 'ITEM'))
}
/** Tab mete la fila en el grupo de arriba (Shift+Tab la saca); si no se puede, pasa a la celda siguiente */
async function onTab(row: BudgetSheetRowDto, shift: boolean) {
  const moving = shift ? editor.outdent(row.id) : editor.indent(row.id)
  if (moving) {
    await moving
    await focusCell(row.id)
  } else if (!shift) {
    const next = columns.value.find((c) => c !== 'code')
    if (next) await focusCell(row.id, next)
  }
}
function onMove(row: BudgetSheetRowDto, col: string, delta: -1 | 1) {
  const list = editor.rows.value
  const next = list[list.findIndex((r) => r.id === row.id) + delta]
  if (next) void focusCell(next.id, col)
}
async function onPaste(row: BudgetSheetRowDto, text: string) {
  const rows = parsePastedRows(text)
  if (!rows.length) return
  // Si la fila actual está vacía, el pegado la reemplaza
  const empty = row.kind === 'ITEM' && !row.description && row.cost === 0
  const ids = await editor.insertRows(row.id, rows)
  if (empty && ids.length) await editor.removeRow(row)
  await focusCell(ids[ids.length - 1] ?? null)
}

async function onAction(row: BudgetSheetRowDto, action: RowAction) {
  const add = async (kind: BudgetRowKind) => focusCell(await editor.addRow(row.id, kind))
  switch (action) {
    case 'fromCatalog':
      catalogAnchor.value = row.id
      catalogOpen.value = true
      return
    case 'addItem':
      return add('ITEM')
    case 'addNote':
      return add('NOTE')
    case 'addSubgroup':
      return add('GROUP')
    case 'addGroup':
      return focusCell(await editor.addSiblingGroup(row.id))
    case 'toItem':
    case 'toGroup':
    case 'toNote':
      return editor.updateRow(row.id, { kind: action === 'toItem' ? 'ITEM' : action === 'toGroup' ? 'GROUP' : 'NOTE' })
    case 'up':
      return editor.moveBy(row.id, -1)
    case 'down':
      return editor.moveBy(row.id, 1)
    case 'indent':
      return editor.indent(row.id)
    case 'outdent':
      return editor.outdent(row.id)
    case 'duplicate':
      return focusCell(await editor.duplicateRow(row.id))
    case 'delete':
      return editor.removeRow(row)
  }
}

/** Botones del pie: agregan al final, dentro del mismo grupo que la última fila */
async function appendRow(kind: BudgetRowKind) {
  const last = editor.rows.value[editor.rows.value.length - 1] ?? null
  if (kind === 'GROUP' && last) {
    const rootLast = [...props.sheet.rows].reverse().find((r) => r.parentId === null)
    return focusCell(rootLast ? await editor.addSiblingGroup(rootLast.id) : await editor.addRow(null, 'GROUP'))
  }
  await focusCell(await editor.addRow(last?.id ?? null, kind))
}

// ── Clic derecho: el menú de la fila bajo el cursor; Shift + clic derecho deja el del navegador ──
const menuRow = ref<BudgetSheetRowDto | null>(null)
const menuItems = computed(() => {
  const row = menuRow.value
  return row ? rowActions(row, (action) => void onAction(row, action)) : []
})
function onContextMenu(e: MouseEvent) {
  const id = (e.target as HTMLElement).closest<HTMLElement>('[data-row-id]')?.dataset.rowId
  if (!id || e.shiftKey) {
    e.stopPropagation()
    return
  }
  menuRow.value = editor.rows.value.find((r) => r.id === id) ?? null
}
/** El botón derecho no entra a editar la celda (el menú actúa sobre la fila) */
function onMouseDown(e: MouseEvent) {
  if (e.button === 2 && !e.shiftKey && props.canWrite) e.preventDefault()
}

// ── Arrastrar y soltar ──
const dragId = ref<string | null>(null)
const drop = ref<{ id: string; zone: DropZone } | null>(null)

function onDragStart(row: BudgetSheetRowDto, e: DragEvent) {
  if (!e.dataTransfer) return
  dragId.value = row.id
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', row.id)
  const tr = (e.target as HTMLElement).closest('tr')
  if (tr) e.dataTransfer.setDragImage(tr, 24, tr.offsetHeight / 2)
}
/** En un grupo, el centro de la fila es «dentro»; los bordes, antes o después */
function zoneAt(e: DragEvent, row: BudgetSheetRowDto): DropZone {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const y = (e.clientY - rect.top) / rect.height
  if (row.kind !== 'GROUP') return y < 0.5 ? 'before' : 'after'
  return y < 0.25 ? 'before' : y > 0.75 ? 'after' : 'inside'
}
function onDragOver(row: BudgetSheetRowDto, e: DragEvent) {
  if (!dragId.value) return
  const zone = zoneAt(e, row)
  if (!editor.dropPreview(dragId.value, row.id, zone)) {
    drop.value = null
    return
  }
  e.preventDefault()
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
  drop.value = { id: row.id, zone }
}
function onDrop(e: DragEvent) {
  e.preventDefault()
  if (dragId.value && drop.value) editor.dropOn(dragId.value, drop.value.id, drop.value.zone)
  onDragEnd()
}
function onDragEnd() {
  dragId.value = null
  drop.value = null
}
const isDragged = (row: BudgetSheetRowDto) => !!dragId.value && isWithin(props.sheet.rows, row.id, dragId.value)

// Catálogo opcional: una referencia copiada se conserva como partida independiente.
const catalogOpen = ref(false)
const catalogAnchor = ref<string | null>(null)
async function addCatalogRow(payload: CreateBudgetRowsPayload) {
  if (!props.canWrite) return
  const ids = await editor.createRows(payload)
  if (ids.length) {
    catalogOpen.value = false
    await focusCell(ids[0] ?? null)
  }
}

// ── Acciones de archivo ──
const importOpen = ref(false)
const exportExcel = useExportBudgetExcel(projectIdRef)
const openPdf = useOpenProjectBudgetPdf()
const duplicate = useDuplicateBudgetSnapshot(projectIdRef)
const sync = useSyncBudgetFromExecution(projectIdRef)
const activate = useActivateBudgetVersion(projectIdRef)
</script>

<template>
  <div class="space-y-4">
    <BudgetHeaderBar
      :sheet="sheet"
      :saving="editor.saving.value"
      :can-write="canWrite"
      @update="editor.updateHeader"
      @catalog="catalogAnchor = null; catalogOpen = true"
      @import="importOpen = true"
      @export="exportExcel.mutate(`Presupuesto ${sheet.project.code} v${header.version}.xlsx`)"
      @pdf="openPdf(projectId)"
      @duplicate="duplicate.mutate()"
      @sync="sync.mutate()"
      @columns="columnsOpen = true"
      @activate="(id) => activate.mutate(id)"
    />

    <div class="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl bg-gray-50 px-4 py-3 text-theme-xs text-gray-500 dark:bg-white/[0.03] dark:text-gray-400">
      <span class="flex items-center gap-1.5">
        <AppIcon icon="lucide:folder-open" :size="14" class="text-brand-500" />
        <strong class="font-medium text-gray-700 dark:text-gray-300">Grupo</strong> nivel, ambiente o categoría; suma lo que contiene
      </span>
      <span class="flex items-center gap-1.5">
        <AppIcon icon="lucide:list" :size="14" />
        <strong class="font-medium text-gray-700 dark:text-gray-300">Partida</strong> material, producto, servicio o trabajo a cotizar
      </span>
      <span class="flex items-center gap-1.5">
        <AppIcon icon="lucide:sticky-note" :size="14" />
        <strong class="font-medium text-gray-700 dark:text-gray-300">Nota</strong> aclaración sin montos
      </span>
      <span v-if="canWrite" class="flex items-center gap-1.5 sm:ms-auto">
        <AppIcon icon="lucide:grip-vertical" :size="14" />
        Arrastre para ordenar o meter en un grupo · clic derecho: más opciones
      </span>
    </div>

    <!-- Hoja vacía -->
    <div
      v-if="!sheet.rows.length"
      class="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-300 px-4 py-14 text-center dark:border-gray-700"
    >
      <AppIcon icon="lucide:file-spreadsheet" :size="36" color="var(--color-text-muted)" />
      <p class="text-sm font-medium text-gray-800 dark:text-white/90">El presupuesto está vacío</p>
      <p class="max-w-md text-sm text-gray-500 dark:text-gray-400">
        Cree un grupo (por ejemplo «PRIMER NIVEL» o «Sala») y agregue partidas fila por fila, o importe su Excel.
      </p>
      <div v-if="canWrite" class="flex flex-wrap justify-center gap-2">
        <BaseButton variant="primary" size="sm" icon="lucide:folder-plus" @click="appendRow('GROUP')">Agregar grupo</BaseButton>
        <BaseButton variant="outline" size="sm" icon="lucide:plus" @click="appendRow('ITEM')">Agregar partida</BaseButton>
        <BaseButton variant="outline" size="sm" icon="lucide:upload" @click="importOpen = true">Importar Excel</BaseButton>
      </div>
    </div>

    <template v-else>
      <div class="overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <table ref="table" class="w-full min-w-max border-collapse">
          <thead class="sticky top-0 z-[1] bg-gray-50 dark:bg-gray-900">
            <tr>
              <th
                v-for="c in headCells"
                :key="c.key"
                :title="'hint' in c ? c.hint : undefined"
                :class="[
                  'border-b border-gray-200 px-3 py-2.5 text-theme-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase dark:border-gray-800 dark:text-gray-400',
                  c.width,
                  c.align === 'right' ? 'text-right' : 'text-left',
                ]"
              >
                {{ c.key === 'price' && header.igvMode === 'PER_LINE' ? 'Precio (inc. IGV)' : c.label }}
              </th>
              <th class="w-20 border-b border-gray-200 dark:border-gray-800" />
            </tr>
          </thead>
          <ContextMenuActions :items="menuItems" :disabled="!canWrite">
          <tbody @contextmenu.capture="onContextMenu" @mousedown="onMouseDown">
            <BudgetSheetRow
              v-for="row in editor.rows.value"
              :key="row.id"
              :row="row"
              :columns="columns"
              :header="header"
              :collapsed="editor.collapsed.value.has(row.id)"
              :can-write="canWrite"
              :dragging="isDragged(row)"
              :drop-zone="drop?.id === row.id ? drop.zone : null"
              @drag-start="(e) => onDragStart(row, e)"
              @drag-end="onDragEnd"
              @dragover="(e: DragEvent) => onDragOver(row, e)"
              @drop="onDrop"
              @update="(patch) => editor.updateRow(row.id, patch)"
              @enter="onEnter(row)"
              @tab="(shift) => onTab(row, shift)"
              @move="(col, d) => onMove(row, col, d)"
              @paste="(t) => onPaste(row, t)"
              @toggle="editor.toggle(row.id)"
              @action="(a) => onAction(row, a)"
            />
          </tbody>
          </ContextMenuActions>
        </table>
      </div>

      <div v-if="canWrite" class="flex flex-wrap items-center gap-2">
        <BaseButton variant="outline" size="sm" icon="lucide:plus" @click="appendRow('ITEM')">Partida</BaseButton>
        <BaseButton variant="outline" size="sm" icon="lucide:folder-plus" @click="appendRow('GROUP')">Grupo</BaseButton>
        <BaseButton variant="ghost" size="sm" icon="lucide:sticky-note" @click="appendRow('NOTE')">Nota</BaseButton>
        <span class="ms-auto flex items-center gap-1.5 text-theme-xs text-gray-400 dark:text-gray-500">
          Atajos de teclado
          <HelpTooltip
            title="Atajos de la hoja"
            :items="[
              { icon: 'lucide:corner-down-left', term: 'Enter', text: 'Guarda y crea una fila nueva debajo.' },
              { icon: 'lucide:indent-increase', term: 'Tab / Shift+Tab', text: 'Mete la fila en el grupo de arriba o la saca de su grupo.' },
              { icon: 'lucide:arrow-up-down', term: '↑ ↓', text: 'Pasa a la fila de arriba o de abajo.' },
              { icon: 'lucide:undo-2', term: 'Esc', text: 'Deshace lo escrito en la celda.' },
              { icon: 'lucide:calculator', term: 'Fórmulas', text: 'Los montos aceptan operaciones como =95*2.' },
              { icon: 'lucide:clipboard-paste', term: 'Pegar desde Excel', text: 'Pegue varias filas copiadas y se crean como partidas.' },
            ]"
            width="w-80"
            align="end"
            side="top"
          />
        </span>
      </div>

      <BudgetTotalsBar :totals="sheet.totals" :header="header" />
    </template>

    <BudgetCatalogItemModal v-if="catalogOpen" v-model:open="catalogOpen" :sheet="sheet" :anchor-id="catalogAnchor" :saving="editor.saving.value" :can-write="canWrite" @add="addCatalogRow" />

    <BudgetImportModal v-model:open="importOpen" :project-id="projectId" :has-rows="sheet.rows.length > 0" />

    <BaseModal v-model="columnsOpen" title="Columnas visibles" size="sm">
      <div class="space-y-2 p-1">
        <FormCheckbox
          v-for="c in SHEET_COLUMNS.filter((x) => allowedColumns.includes(x.key))"
          :key="c.key"
          :model-value="columnsDraft.includes(c.key)"
          :label="c.label"
          @update:model-value="(on: boolean) => toggleColumn(c.key, on)"
        />
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <BaseButton variant="outline" type="button" @click="columnsOpen = false">Cancelar</BaseButton>
          <BaseButton variant="primary" :disabled="!canWrite" @click="saveColumns">Guardar</BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>
