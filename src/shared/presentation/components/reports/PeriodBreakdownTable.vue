<script lang="ts">
/** Estilo de las filas de detalle (las que van en el slot `detail`) */
export const PERIOD_DETAIL_ROW_CLASS = 'border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800'
</script>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Table, TableBody, TableCell, TableHeader, TableRow } from '../../ui/table'
import AppIcon from '../ui/AppIcon.vue'
import TableBodySkeleton from '../ui/TableBodySkeleton.vue'
import { periodName } from './report-period'
/**
 * PeriodBreakdownTable — tabla de Reportes «por periodo» (como Ventas por periodo y Comisiones de
 * alquileres): una fila por mes —o por año—, que se despliega para ver su detalle, y una fila de
 * totales. La tabla pone la estructura; cada reporte llena las celdas con slots:
 * - `cell` ({ period, column }): celdas de la fila del periodo (salvo la primera)
 * - `detail` ({ period }): filas `<TableRow>` del detalle, con la clase `PERIOD_DETAIL_ROW_CLASS`
 * - `total` ({ column }): celdas de la fila de totales (si `showTotal`)
 */

export interface PeriodColumn {
  key: string
  label: string
  /** Segunda línea del encabezado (p. ej. «precio final») */
  hint?: string
  align?: 'left' | 'right'
  /** Columna principal: encabezado en color de marca */
  highlight?: boolean
}

const props = withDefaults(
  defineProps<{
    periods: string[]
    columns: PeriodColumn[]
    /** El periodo tiene detalle para desplegar */
    hasDetail: (period: string) => boolean
    loading?: boolean
    showTotal?: boolean
    emptyText?: string
    /** Título de la primera columna */
    periodLabel?: string
  }>(),
  { loading: false, showTotal: false, emptyText: 'Sin datos en el periodo.', periodLabel: 'Periodo' },
)

const expanded = ref<string | null>(null)
// Al cambiar el periodo del reporte se cierra lo desplegado
watch(
  () => props.periods.join(),
  () => (expanded.value = null),
)
function toggle(period: string) {
  if (!props.hasDetail(period)) return
  expanded.value = expanded.value === period ? null : period
}

const alignClass = (c: PeriodColumn) => (c.align === 'left' ? 'text-left' : 'text-right')
const columnCount = () => props.columns.length + 1

defineExpose({ toggle })
</script>

<template>
  <div class="overflow-x-auto">
    <Table class="w-full border-collapse text-sm">
      <TableHeader>
        <TableRow class="border-b-2 border-gray-200 dark:border-gray-800">
          <TableCell is-header class="min-w-[220px] px-4 py-3 text-left font-semibold text-gray-500 dark:text-gray-400">{{ periodLabel }}</TableCell>
          <TableCell
            v-for="c in columns"
            :key="c.key"
            is-header
            :class="[
              'px-4 py-3 font-semibold',
              alignClass(c),
              c.highlight ? 'text-brand-500 dark:text-brand-400' : 'text-gray-500 dark:text-gray-400',
            ]"
          >
            {{ c.label }}
            <span v-if="c.hint" class="block text-xs font-normal text-gray-400 dark:text-gray-500">{{ c.hint }}</span>
          </TableCell>
        </TableRow>
      </TableHeader>
      <TableBodySkeleton v-if="loading" :rows="6" :columns="columnCount()" />
      <TableBody v-else>
        <template v-for="p in periods" :key="p">
          <TableRow
            :class="[
              hasDetail(p) ? 'cursor-pointer hover:opacity-90' : '',
              expanded === p ? 'bg-brand-50 dark:bg-brand-500/12' : 'border-b border-gray-200 dark:border-gray-800',
            ]"
            @click="toggle(p)"
          >
            <TableCell class="px-4 py-3 font-medium text-gray-800 dark:text-white/90">
              <span class="inline-flex items-center gap-2 whitespace-nowrap">
                <AppIcon
                  v-if="hasDetail(p)"
                  :icon="expanded === p ? 'lucide:chevron-down' : 'lucide:chevron-right'"
                  :size="14"
                  color="var(--color-text-muted)"
                />
                <span v-else class="w-3.5 shrink-0" />
                {{ periodName(p) }}
              </span>
            </TableCell>
            <TableCell v-for="c in columns" :key="c.key" :class="['whitespace-nowrap px-4 py-3 tabular-nums', alignClass(c)]">
              <slot name="cell" :period="p" :column="c.key" />
            </TableCell>
          </TableRow>
          <slot v-if="expanded === p" name="detail" :period="p" />
        </template>
        <TableRow v-if="!periods.length">
          <TableCell :colspan="columnCount()" class="px-4 py-8 text-center text-gray-400 dark:text-gray-500">{{ emptyText }}</TableCell>
        </TableRow>
      </TableBody>
      <tfoot v-if="showTotal && periods.length > 1">
        <TableRow class="border-t-2 border-gray-200 dark:border-gray-800">
          <TableCell class="px-4 py-3 font-semibold text-gray-800 dark:text-white/90">Total</TableCell>
          <TableCell v-for="c in columns" :key="c.key" :class="['whitespace-nowrap px-4 py-3 font-semibold tabular-nums', alignClass(c)]">
            <slot name="total" :column="c.key" />
          </TableCell>
        </TableRow>
      </tfoot>
    </Table>
  </div>
</template>
