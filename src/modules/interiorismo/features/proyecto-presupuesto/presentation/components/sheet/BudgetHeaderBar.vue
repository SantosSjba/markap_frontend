<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import BaseTabs from '@shared/presentation/components/ui/BaseTabs.vue'
import ActionsDropdown from '@shared/presentation/components/ui/ActionsDropdown.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import { useCurrencyCatalog } from '@shared/presentation/composables/useCurrencyCatalog'
import { formatShortDate } from '@shared/utils/formatters'
import { evaluateAmount } from '../../../domain/budget-sheet-editing'
import type {
  BudgetHeaderDto,
  BudgetIgvMode,
  BudgetMarginMode,
  BudgetSheetDto,
  BudgetStatus,
  UpdateBudgetHeaderPayload,
} from '../../../domain/project-budget.types'
/**
 * BudgetHeaderBar — cómo se calcula el presupuesto (moneda, tipo de cambio, utilidad por línea
 * o global, gastos generales, IGV), su estado y versión, y las acciones de archivo.
 */

const props = defineProps<{ sheet: BudgetSheetDto; saving: boolean; canWrite: boolean }>()
const emit = defineEmits<{
  update: [patch: UpdateBudgetHeaderPayload]
  import: []
  catalog: []
  export: []
  pdf: []
  duplicate: []
  sync: []
  columns: []
  activate: [budgetId: string]
}>()

const h = computed<BudgetHeaderDto>(() => props.sheet.budget)
const { options: currencyOptions } = useCurrencyCatalog()

const MARGIN_TABS = [
  { id: 'PER_LINE', label: 'Utilidad por partida' },
  { id: 'GLOBAL', label: 'GG + utilidad al final' },
] as const
const IGV_OPTIONS: { value: BudgetIgvMode; label: string }[] = [
  { value: 'PER_LINE', label: 'IGV en algunas partidas' },
  { value: 'GLOBAL', label: 'IGV sobre el total' },
  { value: 'NONE', label: 'No incluye IGV' },
]
const STATUS_OPTIONS: { value: BudgetStatus; label: string }[] = [
  { value: 'DRAFT', label: 'Borrador' },
  { value: 'SENT', label: 'Enviado al cliente' },
  { value: 'APPROVED', label: 'Aprobado' },
]

/** Campos numéricos: se guardan al salir del campo */
const drafts = ref({ exchangeRate: '', utilityPct: '', overheadPct: '', igvPct: '', number: '', executionTerm: '' })
watch(
  h,
  (b) => {
    drafts.value = {
      exchangeRate: b.exchangeRate != null ? String(b.exchangeRate) : '',
      utilityPct: String(b.utilityPct),
      overheadPct: String(b.overheadPct),
      igvPct: String(b.igvPct),
      number: b.number ?? '',
      executionTerm: b.executionTerm ?? '',
    }
  },
  { immediate: true },
)
function commitNumber(field: 'exchangeRate' | 'utilityPct' | 'overheadPct' | 'igvPct') {
  const value = evaluateAmount(drafts.value[field])
  if (value === undefined) return
  if (field !== 'exchangeRate' && value === null) return
  if (value === h.value[field]) return
  emit('update', { [field]: value })
}
function commitText(field: 'number' | 'executionTerm') {
  const value = drafts.value[field].trim() || null
  if (value !== h.value[field]) emit('update', { [field]: value })
}

const versionLabel = computed(() =>
  props.sheet.versions.length > 1 ? `Versión ${h.value.version} de ${props.sheet.versions.length}` : 'Versión 1',
)
const versionActions = computed(() =>
  props.sheet.versions
    .filter((v) => !v.isActive)
    .map((v) => ({
      label: `Volver a la versión ${v.version} (${formatShortDate(v.createdAt)})`,
      icon: 'lucide:history',
      onClick: () => emit('activate', v.id),
    })),
)
const fileActions = computed(() => [
  { label: 'Importar Excel', icon: 'lucide:upload', onClick: () => emit('import') },
  { label: 'Descargar Excel', icon: 'lucide:file-spreadsheet', onClick: () => emit('export') },
  { label: 'Vista para el cliente (PDF)', icon: 'lucide:printer', onClick: () => emit('pdf') },
  { label: 'Guardar como nueva versión', icon: 'lucide:copy-plus', onClick: () => emit('duplicate') },
  { label: 'Traer costos reales de Ejecución', icon: 'lucide:refresh-cw', onClick: () => emit('sync') },
  ...versionActions.value,
])

</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center gap-3">
      <div class="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <span class="font-semibold text-gray-800 dark:text-white/90">{{ versionLabel }}</span>
        <span v-if="saving" class="flex items-center gap-1 text-theme-xs text-brand-500">
          <AppIcon icon="lucide:loader-circle" :size="14" class="animate-spin" /> Guardando…
        </span>
        <span v-else class="flex items-center gap-1 text-theme-xs">
          <AppIcon icon="lucide:check" :size="14" /> Guardado
        </span>
      </div>
      <BaseTabs
        variant="segmented"
        :model-value="h.marginMode"
        :tabs="MARGIN_TABS"
        @update:model-value="(v: BudgetMarginMode) => canWrite && emit('update', { marginMode: v })"
      />
      <BaseButton v-if="canWrite" variant="outline" size="sm" icon="lucide:book-open" @click="emit('catalog')">Desde catálogo</BaseButton>
      <BaseButton variant="outline" size="sm" icon="lucide:columns-3" @click="emit('columns')">Columnas</BaseButton>
      <ActionsDropdown :items="canWrite ? fileActions : fileActions.slice(1, 3)" />
    </div>

    <div class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,14rem),1fr))] items-end gap-3">
      <FormInput id="budget-number" v-model="drafts.number" size="sm" label="N° presupuesto" :disabled="!canWrite" placeholder="29.08-2025" @blur="commitText('number')" />
      <FormSelect id="budget-status" size="sm" label="Estado" :model-value="h.status" :options="STATUS_OPTIONS" :disabled="!canWrite" @update:model-value="(value) => value && emit('update', { status: value as BudgetStatus })" />
      <FormSelect id="budget-currency" size="sm" label="Moneda" :model-value="h.currency" :options="currencyOptions" :disabled="!canWrite" @update:model-value="(value) => value && emit('update', { currency: String(value) })" />
      <FormInput id="budget-rate" v-model="drafts.exchangeRate" size="sm" label="Tipo de cambio" inputmode="decimal" :disabled="!canWrite" placeholder="3.50" @blur="commitNumber('exchangeRate')" />
      <FormInput id="budget-utility" v-model="drafts.utilityPct" size="sm" label="Utilidad %" inputmode="decimal" :disabled="!canWrite" @blur="commitNumber('utilityPct')" />
      <FormInput id="budget-overhead" v-model="drafts.overheadPct" size="sm" label="Gastos generales %" inputmode="decimal" :disabled="!canWrite" @blur="commitNumber('overheadPct')" />
      <FormSelect id="budget-igv-mode" size="sm" label="IGV" :model-value="h.igvMode" :options="IGV_OPTIONS" :disabled="!canWrite" @update:model-value="(value) => value && emit('update', { igvMode: value as BudgetIgvMode })" />
      <FormInput id="budget-igv" v-model="drafts.igvPct" size="sm" label="IGV %" inputmode="decimal" :disabled="!canWrite || h.igvMode === 'NONE'" @blur="commitNumber('igvPct')" />
    </div>
  </div>
</template>
