<script setup lang="ts">
import { computed } from 'vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import ActionsDropdown from '@shared/presentation/components/ui/ActionsDropdown.vue'
import IconButton from '@shared/presentation/components/ui/IconButton.vue'
import { evaluateAmount, type DropZone } from '../../../domain/budget-sheet-editing'
import type { BudgetHeaderDto, BudgetRowFields, BudgetSheetRowDto } from '../../../domain/project-budget.types'
import BudgetCell from './BudgetCell.vue'
import { ROW_STATUS_OPTIONS, rowActions, type RowAction, type SheetColumnKey } from './budget-sheet-columns'
/**
 * Una fila de la hoja: grupo (con subtotal y plegado), partida (celdas editables) o nota
 * (texto). Los montos se muestran sin símbolo; la moneda está en la cabecera.
 * El asa ⠿ arrastra la fila; la hoja decide dónde cae y marca la zona con `dropZone`.
 */

const props = defineProps<{
  row: BudgetSheetRowDto
  columns: SheetColumnKey[]
  header: BudgetHeaderDto
  collapsed: boolean
  canWrite: boolean
  /** Esta fila (o su grupo) se está arrastrando */
  dragging?: boolean
  /** Dónde caería la fila arrastrada si se suelta aquí */
  dropZone?: DropZone | null
}>()

const emit = defineEmits<{
  update: [patch: BudgetRowFields]
  enter: []
  tab: [shift: boolean]
  move: [col: string, delta: -1 | 1]
  paste: [text: string]
  toggle: []
  action: [name: RowAction]
  dragStart: [event: DragEvent]
  dragEnd: []
}>()

const r = computed(() => props.row)
const isGroup = computed(() => r.value.kind === 'GROUP')
const isNote = computed(() => r.value.kind === 'NOTE')
const perLine = computed(() => props.header.marginMode === 'PER_LINE')

const fmt = (n: number | null | undefined, decimals = 2) =>
  n == null ? '' : n.toLocaleString('es-PE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
const fmtQty = (n: number | null) =>
  n == null ? '' : n.toLocaleString('es-PE', { maximumFractionDigits: 4 })
const raw = (n: number | null | undefined) => (n == null ? '' : String(n))

/** Celda numérica: guarda el número (o null si se vació); texto inválido no se guarda */
function commitAmount(field: keyof BudgetRowFields, text: string) {
  const value = evaluateAmount(text)
  if (value === undefined) return
  emit('update', { [field]: value } as BudgetRowFields)
}

/** Costo escrito a mano cuando también hay metrado × P.U. distinto */
const costOverridden = computed(
  () =>
    r.value.directCost != null &&
    r.value.quantity != null &&
    r.value.unitPrice != null &&
    Math.abs(r.value.quantity * r.value.unitPrice - r.value.directCost) >= 0.005,
)

const statusOption = computed(() => ROW_STATUS_OPTIONS.find((o) => o.value === r.value.status))

const actions = computed(() => rowActions(r.value, (name) => emit('action', name)))

const cellClass = 'border-b border-gray-100 px-1 py-0.5 dark:border-gray-800'
</script>

<template>
  <tr
    :data-row-id="row.id"
    :class="[
      'group/row transition-colors',
      isGroup
        ? row.depth === 0
          ? 'bg-gray-100/80 dark:bg-white/[0.05]'
          : 'bg-gray-50/80 dark:bg-white/[0.02]'
        : 'hover:bg-gray-50/60 dark:hover:bg-white/[0.02]',
      dragging && 'opacity-40',
      dropZone === 'before' && 'shadow-[inset_0_2px_0_0_var(--color-brand-500)]',
      dropZone === 'after' && 'shadow-[inset_0_-2px_0_0_var(--color-brand-500)]',
      dropZone === 'inside' && 'bg-brand-50! outline-2 -outline-offset-2 outline-brand-500 dark:bg-brand-500/10!',
    ]"
  >
    <template v-for="col in ['code', 'description', ...columns.filter((c) => c !== 'code')]" :key="col">
      <!-- Ítem / código -->
      <td v-if="col === 'code' && columns.includes('code')" :class="cellClass">
        <BudgetCell
          :value="row.manualCode ?? ''"
          :display="row.code"
          :placeholder="row.code"
          :row-id="row.id"
          col="code"
          :readonly="!canWrite || isNote"
          input-class="text-xs font-medium text-gray-500 dark:text-gray-400"
          title="Vacío = numeración automática"
          @commit="(v) => emit('update', { code: v.trim() || null })"
          @move="(d) => emit('move', 'code', d)"
        />
      </td>

      <!-- Descripción (con sangría por nivel y plegado de grupos) -->
      <td v-else-if="col === 'description'" :class="[cellClass, 'min-w-[440px]']">
        <div class="flex items-center gap-1">
          <span
            v-if="canWrite"
            draggable="true"
            role="button"
            tabindex="-1"
            class="flex h-6 w-4 shrink-0 cursor-grab items-center justify-center rounded text-gray-300 opacity-0 transition-opacity group-hover/row:opacity-100 hover:text-gray-600 active:cursor-grabbing dark:text-gray-600 dark:hover:text-gray-300"
            title="Arrastrar para mover (sobre un grupo: soltar en el centro lo mete dentro)"
            aria-label="Arrastrar fila"
            @dragstart="emit('dragStart', $event)"
            @dragend="emit('dragEnd')"
          >
            <AppIcon icon="lucide:grip-vertical" :size="14" />
          </span>
          <span class="shrink-0" :style="{ width: `${row.depth * 18}px` }" />
          <button
            v-if="isGroup"
            type="button"
            class="flex size-6 shrink-0 items-center justify-center rounded text-gray-400 hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            :aria-label="collapsed ? 'Desplegar grupo' : 'Plegar grupo'"
            @click="emit('toggle')"
          >
            <AppIcon :icon="collapsed ? 'lucide:chevron-right' : 'lucide:chevron-down'" :size="14" />
          </button>
          <span v-else class="size-6 shrink-0" />
          <AppIcon
            v-if="isGroup"
            :icon="collapsed ? 'lucide:folder' : 'lucide:folder-open'"
            :size="15"
            class="shrink-0 text-brand-500"
          />
          <AppIcon v-else-if="isNote" icon="lucide:sticky-note" :size="14" class="shrink-0 text-gray-400" />
          <BudgetCell
            :value="row.description"
            :title="row.description"
            :placeholder="isGroup ? 'Nombre del grupo (nivel, ambiente, partida)…' : isNote ? 'Nota…' : 'Descripción de la partida…'"
            :row-id="row.id"
            col="description"
            :readonly="!canWrite"
            :input-class="isGroup ? 'font-semibold uppercase tracking-wide' : isNote ? 'italic text-gray-500 dark:text-gray-400' : ''"
            @commit="(v) => emit('update', { description: v })"
            @enter="emit('enter')"
            @tab="(s) => emit('tab', s)"
            @move="(d) => emit('move', 'description', d)"
            @paste="(t) => emit('paste', t)"
          />
          <span v-if="isGroup && collapsed" class="shrink-0 text-theme-xs text-gray-400">{{ row.childrenCount }}</span>
        </div>
      </td>

      <!-- Notas: sin montos -->
      <td v-else-if="isNote" :class="cellClass" />

      <!-- Grupos: solo subtotales -->
      <td v-else-if="isGroup" :class="[cellClass, 'px-3 text-right text-sm font-semibold tabular-nums text-gray-800 dark:text-white/90']">
        <template v-if="col === 'cost'">{{ fmt(row.cost) }}</template>
        <template v-else-if="col === 'price'">{{ fmt(row.price) }}</template>
        <template v-else-if="col === 'igv' && row.igv">{{ fmt(row.igv) }}</template>
      </td>

      <!-- Partidas -->
      <td v-else-if="col === 'unit'" :class="cellClass">
        <BudgetCell :value="row.unit ?? ''" :row-id="row.id" col="unit" :readonly="!canWrite" placeholder="und" @commit="(v) => emit('update', { unit: v.trim() || null })" @move="(d) => emit('move', 'unit', d)" />
      </td>
      <td v-else-if="col === 'quantity'" :class="cellClass">
        <BudgetCell :value="raw(row.quantity)" :display="fmtQty(row.quantity)" align="right" :row-id="row.id" col="quantity" :readonly="!canWrite" @commit="(v) => commitAmount('quantity', v)" @move="(d) => emit('move', 'quantity', d)" />
      </td>
      <td v-else-if="col === 'unitPrice'" :class="cellClass">
        <BudgetCell :value="raw(row.unitPrice)" :display="fmt(row.unitPrice)" align="right" :row-id="row.id" col="unitPrice" :readonly="!canWrite" @commit="(v) => commitAmount('unitPrice', v)" @move="(d) => emit('move', 'unitPrice', d)" />
      </td>
      <td v-else-if="col === 'cost'" :class="cellClass">
        <BudgetCell
          :value="raw(row.directCost)"
          :display="fmt(row.cost)"
          align="right"
          :row-id="row.id"
          col="cost"
          :readonly="!canWrite"
          :input-class="costOverridden ? 'text-warning-600 dark:text-warning-400' : ''"
          :title="costOverridden ? `Costo escrito a mano (metrado × P.U. = ${fmt((row.quantity ?? 0) * (row.unitPrice ?? 0))}). Vacíe la celda para volver al cálculo.` : 'Escriba el costo o use metrado × P.U.; acepta fórmulas como =95*2'"
          @commit="(v) => commitAmount('directCost', v)"
          @move="(d) => emit('move', 'cost', d)"
        />
      </td>
      <td v-else-if="col === 'actualCost'" :class="cellClass">
        <BudgetCell
          :value="raw(row.actualCost)"
          :display="fmt(row.actualCost)"
          align="right"
          :row-id="row.id"
          col="actualCost"
          :readonly="!canWrite"
          :input-class="row.deviation != null && row.deviation < 0 ? 'text-error-500' : ''"
          @commit="(v) => commitAmount('actualCost', v)"
          @move="(d) => emit('move', 'actualCost', d)"
        />
      </td>
      <td v-else-if="col === 'utilityPct'" :class="cellClass">
        <BudgetCell
          :value="raw(row.utilityPctOverride)"
          :display="row.utilityPctOverride != null ? fmt(row.utilityPctOverride, 0) : ''"
          :placeholder="String(header.utilityPct)"
          align="right"
          :row-id="row.id"
          col="utilityPct"
          :readonly="!canWrite || !perLine"
          @commit="(v) => commitAmount('utilityPctOverride', v)"
          @move="(d) => emit('move', 'utilityPct', d)"
        />
      </td>
      <td v-else-if="col === 'igv'" :class="cellClass">
        <label class="flex h-8 items-center justify-end gap-2 px-2 text-sm tabular-nums text-gray-600 dark:text-gray-300">
          <span>{{ row.hasIgv ? fmt(row.igv) : '' }}</span>
          <input
            type="checkbox"
            class="size-4 accent-brand-500"
            :checked="row.hasIgv"
            :disabled="!canWrite"
            aria-label="Lleva IGV"
            @change="emit('update', { hasIgv: ($event.target as HTMLInputElement).checked })"
          />
        </label>
      </td>
      <td v-else-if="col === 'price'" :class="[cellClass, 'px-3 text-right text-sm font-medium tabular-nums text-gray-800 dark:text-white/90']">
        {{ fmt(row.price) }}
      </td>
      <td v-else-if="col === 'status'" :class="cellClass">
        <FormSelect
          :model-value="row.status"
          :options="ROW_STATUS_OPTIONS"
          size="xs"
          variant="cell"
          :class="row.status === 'PURCHASED' ? '[&_[data-slot=select-trigger]]:text-success-600 dark:[&_[data-slot=select-trigger]]:text-success-400' : row.status === 'GIFT' ? '[&_[data-slot=select-trigger]]:text-blue-light-500' : '[&_[data-slot=select-trigger]]:text-gray-500 dark:[&_[data-slot=select-trigger]]:text-gray-400'"
          :disabled="!canWrite"
          :data-row="row.id"
          data-col="status"
          :aria-label="`Estado: ${statusOption?.label}`"
          @update:model-value="(value) => value && emit('update', { status: value as BudgetRowFields['status'] })"
        />
      </td>
      <td v-else-if="col === 'note'" :class="cellClass">
        <BudgetCell :value="row.note ?? ''" :row-id="row.id" col="note" :readonly="!canWrite" placeholder="—" @commit="(v) => emit('update', { note: v.trim() || null })" @move="(d) => emit('move', 'note', d)" />
      </td>
    </template>

    <td :class="[cellClass, 'w-20 text-right']">
      <div
        v-if="canWrite"
        class="flex items-center justify-end opacity-0 transition-opacity group-hover/row:opacity-100 focus-within:opacity-100"
      >
        <IconButton
          icon="lucide:plus"
          size="xs"
          :label="isGroup ? 'Agregar partida dentro' : 'Agregar partida debajo'"
          @click="emit('action', 'addItem')"
        />
        <ActionsDropdown :items="actions" />
      </div>
    </td>
  </tr>
</template>
