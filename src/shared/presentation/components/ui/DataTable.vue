<script setup lang="ts">
import { ref, watch, computed, useSlots } from 'vue'
import {
  useVueTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
  type Header,
  type Row,
  type RowSelectionState,
  type FilterFn,
} from '@tanstack/vue-table'
import { Badge } from '../../ui/badge'
import { Checkbox } from '../../ui/checkbox'
import { ArrowDownIcon, ArrowUpIcon, BoxIcon, CheckIcon, ChevronUpDownIcon, SearchIcon } from '../../icons/layout'
import TableBodySkeleton from './TableBodySkeleton.vue'
/**
 * DataTable — @tanstack/vue-table: ordenación, filtro de página, selección y estado vacío.
 *
 * Slots:
 *  #toolbar  — Área encima de la tabla (dentro del mismo card). Úsalo para pasar
 *              SearchInput + FormSelect de filtros server-side desde la vista padre.
 *              El chip de "N seleccionados" se añade automáticamente a la derecha.
 *  #row      — Cuerpo de cada fila: recibe { row, columns }.
 *  #empty    — Contenido adicional bajo el mensaje de estado vacío (p. ej. botón Reintentar).
 *  #footer   — Filas `<tr>` de totales (se renderizan en `<tfoot>`).
 *
 * Si no hay #toolbar pero showGlobalFilter=true, muestra el filtro client-side propio.
 */

export type DataTableSortAccessor = (
  row: unknown,
) => string | number | boolean | Date | null | undefined

export interface DataTableColumn {
  key: string
  label: string
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
  sortAccessor?: DataTableSortAccessor
  sortType?: 'alphanumeric' | 'basic'
}

const props = withDefaults(
  defineProps<{
    columns: DataTableColumn[]
    data: unknown[]
    rowKey?: string
    /** Muestra el filtro client-side propio. Se ignora si se usa el slot #toolbar. */
    showGlobalFilter?: boolean
    selectable?: boolean
    emptyText?: string
    /** Muestra filas skeleton en lugar del cuerpo (p. ej. al buscar o paginar). */
    loading?: boolean
    skeletonRows?: number
  }>(),
  {
    rowKey: 'id',
    showGlobalFilter: false,
    selectable: false,
    emptyText: 'Sin filas para mostrar.',
    loading: false,
    skeletonRows: 8,
  },
)

const slots = useSlots()

const globalFilter = defineModel<string>('globalFilter', { default: '' })
const rowSelection = defineModel<RowSelectionState>('rowSelection', { default: () => ({}) })

const sorting = ref<SortingState>([])

const globalFilterFn: FilterFn<unknown> = (row, _columnId, filterValue, _addMeta) => {
  const q = String(filterValue ?? '')
    .trim()
    .toLowerCase()
  if (!q) return true
  return JSON.stringify(row.original).toLowerCase().includes(q)
}

function alignClass(align?: string) {
  switch (align) {
    case 'center':
      return 'text-center'
    case 'right':
      return 'text-end'
    default:
      return 'text-start'
  }
}

function headerAlign(header: Header<unknown, unknown>) {
  const meta = header.column.columnDef.meta as { align?: string } | undefined
  return alignClass(meta?.align)
}

function ariaSort(
  header: Header<unknown, unknown>,
): 'ascending' | 'descending' | 'none' | undefined {
  if (!header.column.getCanSort()) return undefined
  const s = header.column.getIsSorted()
  if (s === 'asc') return 'ascending'
  if (s === 'desc') return 'descending'
  return 'none'
}

function toColumnDef(col: DataTableColumn): ColumnDef<unknown, unknown> {
  const base: ColumnDef<unknown, unknown> = {
    id: col.key,
    header: col.label,
    meta: { align: col.align },
    enableSorting: col.sortable === true,
  }
  if (col.sortable) {
    base.sortingFn = col.sortType === 'basic' ? 'basic' : 'alphanumeric'
  }
  if (col.sortable && col.sortAccessor) {
    return { ...base, accessorFn: (row: unknown) => col.sortAccessor!(row), sortUndefined: 'last' }
  }
  return { ...base, accessorKey: col.key }
}

const table = useVueTable({
  get data() {
    return props.data
  },
  get columns() {
    return props.columns.map(toColumnDef)
  },
  state: {
    get sorting() {
      return sorting.value
    },
    get globalFilter() {
      return globalFilter.value
    },
    get rowSelection() {
      return rowSelection.value
    },
  },
  onSortingChange: (u) => {
    sorting.value = typeof u === 'function' ? u(sorting.value) : u
  },
  onGlobalFilterChange: (u) => {
    const v = typeof u === 'function' ? u(globalFilter.value) : u
    globalFilter.value = v === undefined || v === null ? '' : String(v)
  },
  onRowSelectionChange: (u) => {
    rowSelection.value = typeof u === 'function' ? u(rowSelection.value) : u
  },
  get enableRowSelection() {
    return props.selectable
  },
  globalFilterFn,
  getCoreRowModel: getCoreRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getRowId: (row, index) => {
    const id = (row as Record<string, unknown>)[props.rowKey]
    return id !== undefined && id !== null ? String(id) : String(index)
  },
})

watch(
  () => props.data,
  () => {
    if (props.selectable) rowSelection.value = {}
  },
)

const selectedCount = computed(() => table.getSelectedRowModel().rows.length)
const totalFiltered = computed(() => table.getFilteredRowModel().rows.length)

/** Muestra el área toolbar si hay slot custom, filtro propio, o filas seleccionadas */
const showToolbar = computed(
  () => !!slots.toolbar || props.showGlobalFilter || (props.selectable && selectedCount.value > 0),
)

const headerSelectState = computed<boolean | 'indeterminate'>(() => {
  if (table.getIsAllPageRowsSelected()) return true
  return table.getIsSomePageRowsSelected() ? 'indeterminate' : false
})

function toggleAllPage(value: boolean | 'indeterminate') {
  table.toggleAllPageRowsSelected(value === true)
}
function toggleRow(row: Row<unknown>, value: boolean | 'indeterminate') {
  row.toggleSelected(value === true)
}
</script>

<template>
  <div class="text-gray-800 dark:text-white/90">
    <!-- ── Toolbar (CardHeader de las tablas TailAdmin) ── -->
    <div
      v-if="showToolbar"
      class="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:px-6 dark:border-gray-800"
    >
      <!-- Slot custom: SearchInput + FormSelects de la vista padre -->
      <template v-if="$slots.toolbar">
        <slot name="toolbar" />
      </template>

      <!-- Filtro client-side propio (sólo si no hay slot custom) -->
      <div
        v-else-if="showGlobalFilter"
        class="flex h-10 w-full items-center gap-2 rounded-[10px] border border-gray-300 bg-white px-3.5 shadow-theme-xs focus-within:border-brand-300 focus-within:ring-3 focus-within:ring-brand-500/20 sm:w-75 dark:border-gray-700 dark:bg-gray-900 dark:focus-within:border-brand-500/40"
      >
        <SearchIcon class="size-5 shrink-0 text-gray-400" />
        <input
          v-model="globalFilter"
          type="search"
          class="h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-gray-800 shadow-none outline-hidden placeholder:text-gray-400 focus:ring-0 dark:bg-transparent dark:text-white/90 dark:placeholder:text-gray-500"
          placeholder="Filtrar en esta página…"
          autocomplete="off"
          aria-label="Filtrar filas visibles"
        />
        <Badge v-if="globalFilter" size="sm" class="tabular-nums">{{ totalFiltered }}</Badge>
      </div>

      <!-- Chip de selección — siempre a la derecha -->
      <Badge v-if="selectable && selectedCount > 0" class="shrink-0 sm:ms-auto">
        <CheckIcon />
        {{ selectedCount }} seleccionado{{ selectedCount !== 1 ? 's' : '' }}
      </Badge>
    </div>

    <!-- ── Tabla ── -->
    <div class="max-w-full overflow-x-auto custom-scrollbar">
      <table class="w-full min-w-[600px]">
        <thead class="border-b border-gray-100 dark:border-gray-800">
          <tr v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
            <!-- Checkbox select-all -->
            <th v-if="selectable" scope="col" class="h-11 w-11 py-3 ps-5 pe-2 sm:ps-6">
              <Checkbox
                :model-value="headerSelectState"
                aria-label="Seleccionar todas las filas de la página"
                @update:model-value="toggleAllPage"
              />
            </th>

            <!-- Cabeceras de columna -->
            <th
              v-for="header in headerGroup.headers"
              :key="header.id"
              scope="col"
              :class="[
                'h-11 px-4 py-3 text-sm font-normal whitespace-nowrap text-gray-500 first:ps-5 last:pe-5 sm:first:ps-6 sm:last:pe-6 dark:text-gray-400',
                headerAlign(header),
              ]"
              :aria-sort="ariaSort(header)"
            >
              <template v-if="!header.isPlaceholder">
                <button
                  v-if="header.column.getCanSort()"
                  type="button"
                  class="group inline-flex items-center gap-1 rounded select-none transition-colors hover:text-gray-700 focus-visible:ring-3 focus-visible:ring-brand-500/20 focus-visible:outline-hidden dark:hover:text-gray-200"
                  :class="header.column.getIsSorted() ? 'text-brand-500 dark:text-brand-400' : undefined"
                  @click="header.column.getToggleSortingHandler()?.($event)"
                >
                  <span>{{ header.column.columnDef.header }}</span>
                  <ArrowUpIcon v-if="header.column.getIsSorted() === 'asc'" class="size-3.5 shrink-0" />
                  <ArrowDownIcon
                    v-else-if="header.column.getIsSorted() === 'desc'"
                    class="size-3.5 shrink-0"
                  />
                  <ChevronUpDownIcon
                    v-else
                    class="size-3.5 shrink-0 opacity-40 transition-opacity group-hover:opacity-80"
                  />
                </button>
                <template v-else>{{ header.column.columnDef.header }}</template>
              </template>
            </th>
          </tr>
        </thead>

        <TableBodySkeleton
          v-if="loading"
          :rows="skeletonRows"
          :columns="columns.length"
          :selectable="selectable"
        />

        <!-- Filas -->
        <tbody
          v-else-if="table.getRowModel().rows.length > 0"
          class="divide-y divide-gray-100 dark:divide-gray-800"
        >
          <tr
            v-for="row in table.getRowModel().rows"
            :key="row.id"
            class="transition-colors"
            :class="
              row.getIsSelected()
                ? 'bg-brand-25 dark:bg-brand-500/5 [&>td]:bg-transparent!'
                : 'hover:bg-gray-50 dark:hover:bg-white/2'
            "
          >
            <td v-if="selectable" class="w-11 py-3 ps-5 pe-2 align-middle sm:ps-6">
              <Checkbox
                :model-value="row.getIsSelected()"
                :disabled="!row.getCanSelect()"
                aria-label="Seleccionar fila"
                @update:model-value="(value) => toggleRow(row, value)"
              />
            </td>
            <!-- La fila se expone como `any`: las vistas la tipan con un cast o con `#row="{ row: item }"`. -->
            <slot name="row" :row="row.original as any" :columns="columns" />
          </tr>
        </tbody>

        <tfoot
          v-if="$slots.footer && !loading && table.getRowModel().rows.length > 0"
          class="border-t border-gray-100 font-medium dark:border-gray-800"
        >
          <slot name="footer" />
        </tfoot>
      </table>

      <!-- Estado vacío -->
      <div
        v-if="!loading && table.getRowModel().rows.length === 0"
        class="flex flex-col items-center justify-center px-6 py-12 text-center"
        role="status"
      >
        <div
          class="mb-3 flex size-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800"
        >
          <BoxIcon class="size-6 text-gray-800 dark:text-white/90" />
        </div>
        <h4 class="text-base font-semibold text-gray-800 dark:text-white/90">
          {{ emptyText }}
        </h4>
        <p v-if="globalFilter" class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Intenta con otro término de búsqueda.
        </p>
        <div v-if="$slots.empty" class="mt-4">
          <slot name="empty" />
        </div>
      </div>
    </div>
  </div>
</template>
