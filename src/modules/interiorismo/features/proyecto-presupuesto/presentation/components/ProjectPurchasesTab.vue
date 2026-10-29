<script setup lang="ts">
import { computed, ref, toRef, watch } from 'vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import BaseModal from '@shared/presentation/components/ui/BaseModal.vue'
import StatsCard from '@shared/presentation/components/ui/StatsCard.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import IconButton from '@shared/presentation/components/ui/IconButton.vue'
import BaseTabs from '@shared/presentation/components/ui/BaseTabs.vue'
import HelpTooltip, { type HelpTooltipItem } from '@shared/presentation/components/ui/HelpTooltip.vue'
import SectionIntro from '@shared/presentation/components/ui/SectionIntro.vue'
import SearchInput from '@shared/presentation/components/forms/SearchInput.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import { formatMoney } from '@shared/utils/money'
import { useExcelExport } from '@shared/presentation/composables/useExcelExport'
import ExcelIcon from '@shared/presentation/components/ui/ExcelIcon.vue'
import { formatShortDate, toCalendarDateString } from '@shared/utils/formatters'
import { useInteriorMaterialSupplierOptions } from '../../../materiales/presentation/composables/useInteriorMaterialSuppliers'
import InteriorSupplierFormModal from '../../../materiales/presentation/components/InteriorSupplierFormModal.vue'
import { evaluateAmount } from '../../domain/budget-sheet-editing'
import type { BudgetRowStatus, BudgetSheetDto, BudgetSheetRowDto } from '../../domain/project-budget.types'
import { PURCHASES_VIEWS, type PurchasesView } from '../../domain/purchases-views'
import { useBudgetSheet } from '../composables/useBudgetSheet'
import BudgetCell from './sheet/BudgetCell.vue'
import { ROW_STATUS_OPTIONS } from './sheet/budget-sheet-columns'
/**
 * Compras del proyecto: una fila por partida del presupuesto con lo presupuestado, el costo real,
 * la desviación, el proveedor y los abonos (sin límite). Los cambios van al mismo presupuesto.
 * Las vistas rápidas separan las partidas según el paso en que están; `view` llega desde las alertas.
 */

const props = defineProps<{ projectId: string; budget: BudgetSheetDto; canWrite: boolean; view?: PurchasesView | null }>()
const sheet = toRef(props, 'budget')
const editor = useBudgetSheet(toRef(props, 'projectId'), sheet)
const currency = computed(() => props.budget.budget.currency)
const money = (n: number | null | undefined) => formatMoney(n, currency.value)

// ── Filtros ──
const search = ref('')
const filterStatus = ref<'ALL' | BudgetRowStatus>('ALL')
const filterSupplier = ref('ALL')
const statusOptions = [{ value: 'ALL', label: 'Todos los estados' }, ...ROW_STATUS_OPTIONS]

// ── Vistas rápidas (pasos del trabajo) ──
const activeView = ref<PurchasesView>(props.view ?? 'all')
watch(
  () => props.view,
  (v) => {
    if (v) activeView.value = v
  },
)
const allItems = computed(() => props.budget.rows.filter((r) => r.kind === 'ITEM'))
const viewTabs = computed(() =>
  (Object.keys(PURCHASES_VIEWS) as PurchasesView[]).map((id) => ({
    id,
    label: `${PURCHASES_VIEWS[id].label} (${allItems.value.filter(PURCHASES_VIEWS[id].test).length})`,
  })),
)

// ── Ayuda (en globos, no en párrafos fijos) ──
const HELP_STEPS: HelpTooltipItem[] = [
  {
    icon: 'lucide:list',
    term: 'Son las partidas del presupuesto',
    text: 'No es una lista de materiales ni de compras ya hechas: cada fila es una partida de la pestaña Presupuesto.',
  },
  { icon: 'lucide:receipt', term: '1. Costo real', text: 'Escriba cuánto costó realmente la partida (acepta fórmulas como =95*2).' },
  {
    icon: 'lucide:truck',
    term: '2. Proveedor o contratista',
    text: 'A quién se le compra o contrata. Déjelo vacío si es con recursos propios o aún no se define. Use «+» para crear uno nuevo.',
  },
  { icon: 'lucide:hand-coins', term: '3. Abonos', text: 'Registre cada pago al proveedor; el saldo se calcula solo.' },
  {
    icon: 'lucide:info',
    term: 'Varios proveedores',
    text: 'Cada partida admite un proveedor. Si un trabajo tiene varios, organícelo como grupo con partidas separadas.',
  },
  { icon: 'lucide:package', term: 'Stock', text: 'Registrar el costo no confirma la compra ni descuenta stock del catálogo.' },
]
const COLUMN_HELP: Record<string, string> = {
  budgeted: 'Costo de la partida en el presupuesto (sin utilidad ni IGV).',
  actual: 'Lo que realmente costó. Mientras esté vacío, la partida no tiene desviación.',
  deviation: 'Presupuestado − costo real. En verde es ahorro; en rojo, sobrecosto.',
  supplier: 'Proveedor o contratista de la partida. «+» crea uno nuevo sin salir.',
  paid: 'Suma de los abonos registrados al proveedor.',
  balance: 'Costo real − abonado: lo que falta pagarle al proveedor.',
  status: 'Pendiente → Cotizado → Comprado. «Obsequio» no se cobra al cliente.',
}

/** Ruta de grupos de cada partida («PRIMER NIVEL › Sala › Mobiliario») */
const groupPath = computed(() => {
  const byId = new Map(props.budget.rows.map((r) => [r.id, r]))
  const path = new Map<string, string>()
  for (const r of props.budget.rows) {
    const names: string[] = []
    for (let p = r.parentId ? byId.get(r.parentId) : undefined; p; p = p.parentId ? byId.get(p.parentId) : undefined) {
      names.unshift(p.description || p.code)
    }
    path.set(r.id, names.join(' › '))
  }
  return path
})

const items = computed(() => {
  const q = search.value.trim().toLocaleLowerCase('es-PE')
  const inView = PURCHASES_VIEWS[activeView.value].test
  return props.budget.rows.filter(
    (r) =>
      r.kind === 'ITEM' &&
      inView(r) &&
      (filterStatus.value === 'ALL' || r.status === filterStatus.value) &&
      (filterSupplier.value === 'ALL' ||
        (filterSupplier.value === 'NONE' ? !r.supplierId && !r.supplierName : r.supplierId === filterSupplier.value)) &&
      (!q ||
        `${r.code} ${r.description} ${r.supplierName ?? ''} ${groupPath.value.get(r.id)}`
          .toLocaleLowerCase('es-PE')
          .includes(q)),
  )
})

const totals = computed(() => {
  const all = props.budget.rows.filter((r) => r.kind === 'ITEM')
  const sum = (pick: (r: BudgetSheetRowDto) => number) => all.reduce((s, r) => s + pick(r), 0)
  return {
    budgeted: sum((r) => r.cost),
    actual: sum((r) => r.actualCost ?? 0),
    paid: sum((r) => r.supplierPaymentsTotal),
    balance: sum((r) => r.supplierId || r.supplierName?.trim() || r.supplierPaymentsTotal > 0 ? Math.max(0, r.supplierBalance ?? 0) : 0),
    purchased: all.filter((r) => r.status === 'PURCHASED').length,
    /** Solo partidas con costo real: presupuestado − real */
    deviation: sum((r) => r.deviation ?? 0),
    count: all.length,
  }
})
const deviation = computed(() => totals.value.deviation)

// ── Proveedores ──
const { data: suppliersData } = useInteriorMaterialSupplierOptions()
const newSupplierOpen = ref(false)
const supplierTarget = ref<BudgetSheetRowDto | null>(null)
function createSupplierFor(row: BudgetSheetRowDto) { supplierTarget.value = row; newSupplierOpen.value = true }
function onSupplierCreated(item: { id: string; name: string }) {
  if (supplierTarget.value) onSupplier(supplierTarget.value, item.id)
  supplierTarget.value = null
}
const supplierOptions = computed(() => [
  { value: '', label: 'Sin proveedor' },
  ...(suppliersData.value ?? []).map((s) => ({ value: s.id, label: s.companyName })),
])

const supplierFilterOptions = computed(() => [
  { value: 'ALL', label: 'Todos los proveedores' },
  { value: 'NONE', label: 'Sin proveedor' },
  ...(suppliersData.value ?? []).map((s) => ({ value: s.id, label: s.companyName })),
])

// ── Exportar (lo filtrado) ──
const { isExporting, exportToExcel } = useExcelExport()
const STATUS_LABEL = Object.fromEntries(ROW_STATUS_OPTIONS.map((o) => [o.value, o.label]))
function exportPurchases() {
  void exportToExcel({
    fileName: `Compras ${props.budget.project.code}`,
    sheetName: 'Compras',
    columns: [
      { header: 'Ítem', key: 'code', width: 10 },
      { header: 'Partida', key: 'description', width: 50 },
      { header: 'Grupo', key: 'group', width: 36 },
      { header: `Presupuestado (${currency.value})`, key: 'cost', width: 16 },
      { header: 'Costo real', key: 'actual', width: 14 },
      { header: 'Desviación', key: 'deviation', width: 14 },
      { header: 'Proveedor', key: 'supplier', width: 28 },
      { header: 'Abonado', key: 'paid', width: 14 },
      { header: 'Saldo', key: 'balance', width: 14 },
      { header: 'Estado', key: 'status', width: 12 },
    ],
    rows: items.value.map((r) => ({
      code: r.code,
      description: r.description,
      group: groupPath.value.get(r.id) ?? '',
      cost: r.cost,
      actual: r.actualCost,
      deviation: r.deviation,
      supplier: r.supplierName ?? '',
      paid: r.supplierPaymentsTotal,
      balance: r.supplierBalance,
      status: STATUS_LABEL[r.status] ?? r.status,
    })),
  })
}

function onActualCost(row: BudgetSheetRowDto, text: string) {
  const value = evaluateAmount(text)
  if (value === undefined) return
  void editor.updateRow(row.id, {
    actualCost: value,
  })
}
function onSupplier(row: BudgetSheetRowDto, supplierId: string | number | null) {
  void editor.updateRow(row.id, { supplierId: supplierId ? String(supplierId) : null, ...(supplierId ? {} : { supplierName: null }) })
}

// ── Abonos ──
const paymentsRow = ref<BudgetSheetRowDto | null>(null)
const paymentsOpen = computed({
  get: () => paymentsRow.value !== null,
  set: (v) => {
    if (!v) paymentsRow.value = null
  },
})
const liveRow = computed(() => props.budget.rows.find((r) => r.id === paymentsRow.value?.id) ?? null)
const draft = ref({ amount: '', paidAt: toCalendarDateString(), note: '' })
const amountError = ref('')
function openPayments(row: BudgetSheetRowDto) {
  paymentsRow.value = row
  draft.value = {
    amount: row.supplierBalance && row.supplierBalance > 0 ? String(row.supplierBalance) : '',
    paidAt: toCalendarDateString(),
    note: '',
  }
  amountError.value = ''
}
async function addPayment() {
  const amount = evaluateAmount(draft.value.amount)
  if (!amount || amount <= 0) {
    amountError.value = 'Ingrese un monto mayor que cero'
    return
  }
  amountError.value = ''
  const ok = await editor.addSupplierPayment(paymentsRow.value!.id, {
    amount,
    paidAt: draft.value.paidAt,
    note: draft.value.note.trim() || null,
  })
  if (ok) draft.value = { amount: '', paidAt: toCalendarDateString(), note: '' }
}

const headColumns = [
  { key: 'budgeted', label: 'Presupuestado', class: 'text-right' },
  { key: 'actual', label: 'Costo real', class: 'w-36 text-right' },
  { key: 'deviation', label: 'Desviación', class: 'text-right' },
  { key: 'supplier', label: 'Proveedor', class: 'w-56 text-left' },
  { key: 'paid', label: 'Abonado', class: 'text-right' },
  { key: 'balance', label: 'Saldo', class: 'text-right' },
  { key: 'status', label: 'Estado', class: 'w-40 text-left' },
]
const th = 'border-b border-gray-200 px-3 py-2.5 text-theme-xs font-medium uppercase tracking-wide whitespace-nowrap text-gray-500 dark:border-gray-800 dark:text-gray-400'
const td = 'border-b border-gray-100 px-3 py-2 text-sm dark:border-gray-800'
</script>

<template>
  <div class="space-y-5">
    <SectionIntro
      title="Compras y contrataciones"
      subtitle="Registre cuánto costó cada partida, a quién se le compró y cuánto se le ha pagado."
      help-title="¿Cómo se usa esta pestaña?"
      :help="HELP_STEPS"
    >
      <template #actions>
      <ol class="flex flex-wrap items-center gap-1.5 text-theme-xs text-gray-500 dark:text-gray-400">
        <li v-for="(step, i) in ['Costo real', 'Proveedor', 'Abonos']" :key="step" class="flex items-center gap-1.5">
          <span class="flex size-5 items-center justify-center rounded-full bg-brand-50 font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">{{ i + 1 }}</span>
          {{ step }}
          <AppIcon v-if="i < 2" icon="lucide:chevron-right" :size="12" class="text-gray-300 dark:text-gray-600" />
        </li>
      </ol>
      </template>
    </SectionIntro>
    <div class="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <StatsCard compact title="Costo presupuestado" :value="money(totals.budgeted)" :subtitle="`${totals.count} partidas`">
        <template #icon><AppIcon icon="lucide:file-spreadsheet" :size="20" /></template>
      </StatsCard>
      <StatsCard
        compact
        title="Costo real"
        :value="money(totals.actual)"
        :subtitle="totals.actual ? `${deviation >= 0 ? 'ahorro' : 'sobrecosto'} ${money(Math.abs(deviation))}` : `${totals.purchased} compradas`"
      >
        <template #icon><AppIcon icon="lucide:shopping-cart" :size="20" /></template>
      </StatsCard>
      <StatsCard compact title="Abonado a proveedores" :value="money(totals.paid)">
        <template #icon><AppIcon icon="lucide:hand-coins" :size="20" /></template>
      </StatsCard>
      <StatsCard compact title="Saldo con proveedores" :value="money(totals.balance)" subtitle="por pagar">
        <template #icon><AppIcon icon="lucide:hourglass" :size="20" /></template>
      </StatsCard>
    </div>

    <div class="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div class="border-b border-gray-200 px-4 pt-4 dark:border-gray-800">
        <BaseTabs v-model="activeView" :tabs="viewTabs" variant="segmented" />
      </div>
      <div class="flex flex-wrap items-center gap-3 border-b border-gray-200 p-4 dark:border-gray-800">
        <div class="min-w-0 flex-1"><SearchInput v-model="search" placeholder="Buscar partida, grupo o proveedor..." /></div>
        <div class="w-full sm:w-[190px]"><FormSelect v-model="filterStatus" :options="statusOptions" /></div>
        <div class="w-full sm:w-[210px]"><FormSelect v-model="filterSupplier" :options="supplierFilterOptions" /></div>
        <BaseButton variant="outline" :loading="isExporting" :disabled="!items.length" @click="exportPurchases">
          <ExcelIcon class="size-4" /> Exportar
        </BaseButton>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full min-w-max border-collapse">
          <thead class="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th :class="[th, 'text-left']">Partida</th>
              <th v-for="c in headColumns" :key="c.key" :class="[th, c.class]">
                <span :class="['inline-flex items-center gap-1', c.class.includes('text-right') && 'flex-row-reverse']">
                  {{ c.label }}
                  <HelpTooltip :text="COLUMN_HELP[c.key]" :size="13" width="w-64" />
                </span>
              </th>
              <th :class="[th, 'w-28']" />
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in items" :key="row.id" class="hover:bg-gray-50/60 dark:hover:bg-white/[0.02]">
              <td :class="td">
                <p class="font-medium text-gray-800 dark:text-white/90">
                  <span class="me-1 text-theme-xs text-gray-400">{{ row.code }}</span>{{ row.description || 'Sin descripción' }}
                </p>
                <p class="text-theme-xs text-gray-400 dark:text-gray-500">{{ groupPath.get(row.id) }}</p>
              </td>
              <td :class="[td, 'text-right tabular-nums']">{{ money(row.cost) }}</td>
              <td :class="[td, 'px-1']">
                <BudgetCell
                  :value="row.actualCost != null ? String(row.actualCost) : ''"
                  :display="row.actualCost != null ? money(row.actualCost) : ''"
                  placeholder="—"
                  align="right"
                  :row-id="row.id"
                  col="actualCost"
                  :readonly="!canWrite"
                  @commit="(v) => onActualCost(row, v)"
                />
              </td>
              <td
                :class="[td, 'text-right tabular-nums', row.deviation == null ? 'text-gray-400' : row.deviation < 0 ? 'text-error-500' : 'text-success-600 dark:text-success-400']"
              >
                {{ row.deviation == null ? '—' : money(row.deviation) }}
              </td>
              <td :class="[td, 'px-1']">
                <div class="flex items-center gap-1">
                <FormSelect
                  size="sm"
                  :model-value="row.supplierId ?? ''"
                  :options="supplierOptions"
                  :disabled="!canWrite"
                  @update:model-value="(v) => onSupplier(row, v)"
                />
                <IconButton v-if="canWrite" icon="lucide:plus" label="Crear proveedor para esta partida" @click="createSupplierFor(row)" />
                </div>
                <p v-if="!row.supplierId && row.supplierName" class="px-2 pt-0.5 text-theme-xs text-gray-400">{{ row.supplierName }}</p>
              </td>
              <td :class="[td, 'text-right tabular-nums']">
                {{ row.supplierPaymentsTotal ? money(row.supplierPaymentsTotal) : '—' }}
                <span v-if="row.supplierPayments.length" class="block text-theme-xs text-gray-400">{{ row.supplierPayments.length }} abono(s)</span>
              </td>
              <td :class="[td, 'text-right tabular-nums', (row.supplierBalance ?? 0) > 0.009 ? 'font-medium text-warning-600 dark:text-warning-400' : 'text-gray-400']">
                {{ row.supplierBalance == null || (!row.supplierId && !row.supplierName?.trim() && !row.supplierPaymentsTotal) ? '—' : money(row.supplierBalance) }}
              </td>
              <td :class="td"><FormSelect size="sm" :model-value="row.status" :options="ROW_STATUS_OPTIONS" :disabled="!canWrite" :aria-label="`Estado de ${row.description}`" @update:model-value="(value) => value && editor.updateRow(row.id, { status: value as BudgetRowStatus })" /></td>
              <td :class="[td, 'text-right']">
                <BaseButton variant="outline" size="sm" icon="lucide:hand-coins" @click="openPayments(row)">
                  Abonos<span v-if="row.supplierPayments.length" class="text-gray-400">· {{ row.supplierPayments.length }}</span>
                </BaseButton>
              </td>
            </tr>
            <tr v-if="!items.length">
              <td colspan="9" class="px-4 py-12 text-center text-sm text-gray-400 dark:text-gray-500">
                {{ allItems.length ? `No hay partidas en «${PURCHASES_VIEWS[activeView].label}» con estos filtros.` : 'Agregue partidas en la pestaña Presupuesto para gestionar compras.' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <InteriorSupplierFormModal v-model:open="newSupplierOpen" @created="onSupplierCreated" />

    <BaseModal v-model="paymentsOpen" :title="`Abonos — ${liveRow?.description ?? ''}`" size="md">
      <div v-if="liveRow" class="space-y-4 p-1">
        <dl class="grid grid-cols-3 gap-3 text-sm">
          <div><dt class="text-theme-xs text-gray-400">Costo real</dt><dd class="font-medium">{{ money(liveRow.actualCost) }}</dd></div>
          <div><dt class="text-theme-xs text-gray-400">Abonado</dt><dd class="font-medium">{{ money(liveRow.supplierPaymentsTotal) }}</dd></div>
          <div><dt class="text-theme-xs text-gray-400">Saldo</dt><dd class="font-medium text-warning-600">{{ money(liveRow.supplierBalance) }}</dd></div>
        </dl>
        <ul v-if="liveRow.supplierPayments.length" class="divide-y divide-gray-100 rounded-lg border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
          <li v-for="(p, i) in liveRow.supplierPayments" :key="p.id" class="flex items-center gap-3 px-3 py-2 text-sm">
            <span class="text-theme-xs text-gray-400">#{{ i + 1 }}</span>
            <span class="text-gray-500">{{ formatShortDate(p.paidAt) }}</span>
            <span class="min-w-0 flex-1 truncate text-gray-500">{{ p.note }}</span>
            <span class="font-medium tabular-nums">{{ money(p.amount) }}</span>
            <IconButton v-if="canWrite" icon="lucide:trash-2" label="Eliminar abono" @click="editor.deleteSupplierPayment(p.id)" />
          </li>
        </ul>
        <p v-else class="text-sm text-gray-400">Aún no hay abonos.</p>
        <div v-if="canWrite" class="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <FormInput v-model="draft.amount" label="Monto" inputmode="decimal" :error="amountError" />
          <FormInput v-model="draft.paidAt" type="date" label="Fecha" />
          <FormInput v-model="draft.note" label="Nota" placeholder="Opcional" />
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <BaseButton variant="outline" type="button" @click="paymentsOpen = false">Cerrar</BaseButton>
          <BaseButton v-if="canWrite" variant="primary" icon="lucide:plus" :loading="editor.saving.value" @click="addPayment">Registrar abono</BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>
