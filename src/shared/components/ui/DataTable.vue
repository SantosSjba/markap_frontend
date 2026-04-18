<script setup lang="ts">
/**
 * DataTable — @tanstack/vue-table: ordenación, filtro de página, selección y estado vacío.
 *
 * Slots:
 *  #toolbar  — Área encima de la tabla (dentro del mismo card). Úsalo para pasar
 *              SearchInput + FormSelect de filtros server-side desde la vista padre.
 *              El chip de "N seleccionados" se añade automáticamente a la derecha.
 *  #row      — Cuerpo de cada fila: recibe { row, columns }.
 *  #empty    — Reemplaza el estado vacío por defecto.
 *
 * Si no hay #toolbar pero showGlobalFilter=true, muestra el filtro client-side propio.
 */
import { ref, watch, watchPostEffect, computed, useSlots } from 'vue'
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
import AppIcon from './AppIcon.vue'

export type DataTableSortAccessor = (row: unknown) => string | number | boolean | Date | null | undefined

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
  }>(),
  {
    rowKey: 'id',
    showGlobalFilter: false,
    selectable: false,
    emptyText: 'Sin filas para mostrar.',
  },
)

const slots = useSlots()

const globalFilter = defineModel<string>('globalFilter', { default: '' })
const rowSelection = defineModel<RowSelectionState>('rowSelection', { default: () => ({}) })

const sorting = ref<SortingState>([])
const headerSelectRef = ref<HTMLInputElement | null>(null)

const globalFilterFn: FilterFn<unknown> = (row, _columnId, filterValue, _addMeta) => {
  const q = String(filterValue ?? '').trim().toLowerCase()
  if (!q) return true
  return JSON.stringify(row.original).toLowerCase().includes(q)
}

function alignClass(align?: string) {
  switch (align) {
    case 'center': return 'text-center'
    case 'right':  return 'text-right'
    default:       return 'text-left'
  }
}

function headerAlign(header: Header<unknown, unknown>) {
  const meta = header.column.columnDef.meta as { align?: string } | undefined
  return alignClass(meta?.align)
}

function ariaSort(header: Header<unknown, unknown>): 'ascending' | 'descending' | 'none' | undefined {
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
  get data() { return props.data },
  get columns() { return props.columns.map(toColumnDef) },
  state: {
    get sorting() { return sorting.value },
    get globalFilter() { return globalFilter.value },
    get rowSelection() { return rowSelection.value },
  },
  onSortingChange: (u) => { sorting.value = typeof u === 'function' ? u(sorting.value) : u },
  onGlobalFilterChange: (u) => {
    const v = typeof u === 'function' ? u(globalFilter.value) : u
    globalFilter.value = v === undefined || v === null ? '' : String(v)
  },
  onRowSelectionChange: (u) => { rowSelection.value = typeof u === 'function' ? u(rowSelection.value) : u },
  get enableRowSelection() { return props.selectable },
  globalFilterFn,
  getCoreRowModel: getCoreRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getRowId: (row, index) => {
    const id = (row as Record<string, unknown>)[props.rowKey]
    return id !== undefined && id !== null ? String(id) : String(index)
  },
})

watch(() => props.data, () => {
  if (props.selectable) rowSelection.value = {}
})

const selectedCount = computed(() => table.getSelectedRowModel().rows.length)
const totalFiltered = computed(() => table.getFilteredRowModel().rows.length)

/** Muestra el área toolbar si hay slot custom, filtro propio, o filas seleccionadas */
const showToolbar = computed(() =>
  !!slots.toolbar || props.showGlobalFilter || (props.selectable && selectedCount.value > 0),
)

watchPostEffect(() => {
  const el = headerSelectRef.value
  if (!el || !props.selectable) return
  const some = table.getIsSomePageRowsSelected()
  const all  = table.getIsAllPageRowsSelected()
  el.indeterminate = some && !all
})

function toggleAllPage(e: Event) { table.getToggleAllPageRowsSelectedHandler()(e) }
function toggleRow(row: Row<unknown>, e: Event) { row.getToggleSelectedHandler()(e) }
</script>

<template>
  <div :style="{ color: 'var(--color-text-primary)' }">

    <!-- ── Toolbar ── -->
    <div
      v-if="showToolbar"
      class="flex flex-col sm:flex-row sm:items-start sm:gap-x-3 sm:gap-y-3 gap-3 px-4 py-3.5"
      :style="{
        borderBottom: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-surface)',
      }"
    >
      <!-- Slot custom: SearchInput + FormSelects de la vista padre -->
      <template v-if="$slots.toolbar">
        <slot name="toolbar" />
      </template>

      <!-- Filtro client-side propio (sólo si no hay slot custom) -->
      <div
        v-else-if="showGlobalFilter"
        class="flex items-center gap-2 flex-1 max-w-xs px-1 py-1"
      >
        <AppIcon icon="lucide:search" :size="14" color="var(--color-text-muted)" class="shrink-0" />
        <input
          v-model="globalFilter"
          type="search"
          class="min-w-0 flex-1 bg-transparent text-sm outline-none leading-none"
          :style="{ color: 'var(--color-text-primary)' }"
          placeholder="Filtrar en esta página…"
          autocomplete="off"
          aria-label="Filtrar filas visibles"
        />
        <span
          v-if="globalFilter"
          class="text-xs tabular-nums shrink-0 rounded-full px-1.5 py-0.5 font-medium"
          :style="{
            backgroundColor: 'color-mix(in srgb, var(--color-primary) 12%, transparent)',
            color: 'var(--color-primary)',
          }"
        >{{ totalFiltered }}</span>
      </div>

      <!-- Chip de selección — siempre a la derecha -->
      <div
        v-if="selectable && selectedCount > 0"
        class="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium shrink-0 sm:ml-auto"
        :style="{
          backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
          color: 'var(--color-primary)',
          border: '1px solid color-mix(in srgb, var(--color-primary) 22%, transparent)',
        }"
      >
        <AppIcon icon="lucide:check-square-2" :size="12" color="currentColor" />
        {{ selectedCount }} seleccionado{{ selectedCount !== 1 ? 's' : '' }}
      </div>
    </div>

    <!-- ── Tabla ── -->
    <div class="overflow-x-auto">
      <table class="w-full min-w-[600px]">

        <thead>
          <tr
            v-for="headerGroup in table.getHeaderGroups()"
            :key="headerGroup.id"
            :style="{ borderBottom: '2px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }"
          >
            <!-- Checkbox select-all -->
            <th
              v-if="selectable"
              scope="col"
              class="w-11 py-3 pl-4 pr-2"
            >
              <input
                ref="headerSelectRef"
                type="checkbox"
                class="h-4 w-4 rounded cursor-pointer accent-[var(--color-primary)]"
                :style="{ borderColor: 'var(--color-border)' }"
                :checked="table.getIsAllPageRowsSelected()"
                aria-label="Seleccionar todas las filas de la página"
                @change="toggleAllPage($event)"
              />
            </th>

            <!-- Cabeceras de columna -->
            <th
              v-for="header in headerGroup.headers"
              :key="header.id"
              scope="col"
              :class="['py-3 px-4 text-xs font-semibold uppercase tracking-wider whitespace-nowrap', headerAlign(header)]"
              :style="{ color: 'var(--color-text-secondary)', letterSpacing: '0.06em' }"
              :aria-sort="ariaSort(header)"
            >
              <template v-if="!header.isPlaceholder">
                <button
                  v-if="header.column.getCanSort()"
                  type="button"
                  class="group inline-flex items-center gap-1 select-none rounded px-0.5 py-0.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                  :style="{ color: header.column.getIsSorted() ? 'var(--color-primary)' : 'inherit' }"
                  @click="header.column.getToggleSortingHandler()?.($event)"
                >
                  <span>{{ header.column.columnDef.header }}</span>
                  <AppIcon
                    v-if="header.column.getIsSorted() === 'asc'"
                    icon="lucide:arrow-up"
                    :size="11"
                    color="currentColor"
                    class="shrink-0"
                  />
                  <AppIcon
                    v-else-if="header.column.getIsSorted() === 'desc'"
                    icon="lucide:arrow-down"
                    :size="11"
                    color="currentColor"
                    class="shrink-0"
                  />
                  <AppIcon
                    v-else
                    icon="lucide:chevrons-up-down"
                    :size="11"
                    color="currentColor"
                    class="shrink-0 opacity-0 group-hover:opacity-60 transition-opacity"
                  />
                </button>
                <template v-else>{{ header.column.columnDef.header }}</template>
              </template>
            </th>
          </tr>
        </thead>

        <!-- Filas -->
        <tbody v-if="table.getRowModel().rows.length > 0">
          <tr
            v-for="row in table.getRowModel().rows"
            :key="row.id"
            class="transition-colors"
            :class="row.getIsSelected() ? '' : 'hover:bg-[var(--color-hover)]'"
            :style="{
              borderBottom: '1px solid var(--color-border)',
              backgroundColor: row.getIsSelected()
                ? 'color-mix(in srgb, var(--color-primary) 5%, var(--color-surface))'
                : undefined,
            }"
          >
            <td v-if="selectable" class="w-11 py-3 pl-4 pr-2 align-middle">
              <input
                type="checkbox"
                class="h-4 w-4 rounded cursor-pointer accent-[var(--color-primary)] transition-opacity"
                :class="row.getIsSelected() ? 'opacity-100' : 'opacity-40 hover:opacity-80'"
                :style="{ borderColor: 'var(--color-border)' }"
                :checked="row.getIsSelected()"
                :disabled="!row.getCanSelect()"
                aria-label="Seleccionar fila"
                @change="toggleRow(row, $event)"
              />
            </td>
            <slot name="row" :row="row.original" :columns="columns" />
          </tr>
        </tbody>

      </table>

      <!-- Estado vacío -->
      <div
        v-if="table.getRowModel().rows.length === 0"
        class="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center"
        role="status"
      >
        <div
          class="flex h-11 w-11 items-center justify-center rounded-full"
          :style="{ backgroundColor: 'color-mix(in srgb, var(--color-text-muted) 8%, transparent)' }"
        >
          <AppIcon icon="lucide:inbox" :size="20" color="var(--color-text-muted)" />
        </div>
        <div>
          <p class="text-sm font-medium" :style="{ color: 'var(--color-text-secondary)' }">
            {{ emptyText }}
          </p>
          <p v-if="globalFilter" class="text-xs mt-1" :style="{ color: 'var(--color-text-muted)' }">
            Intenta con otro término de búsqueda.
          </p>
        </div>
        <slot name="empty" />
      </div>

    </div>
  </div>
</template>
