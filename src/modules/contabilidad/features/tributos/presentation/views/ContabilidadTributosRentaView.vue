<script setup lang="ts">
import { useApplicationAccess } from '@modules/applications/presentation/composables/useApplicationAccess'
const { canWrite } = useApplicationAccess('contabilidad')

import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@shared/presentation/ui/table'
import DataTable from '@shared/presentation/components/ui/DataTable.vue'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import BaseTabs from '@shared/presentation/components/ui/BaseTabs.vue'
import FormInput from '@shared/presentation/components/forms/FormInput.vue'
import FormTextarea from '@shared/presentation/components/forms/FormTextarea.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import StatsCard from '@shared/presentation/components/ui/StatsCard.vue'
import { useContabilidadActivePeriod } from '../../../../presentation/composables/useContabilidadActivePeriod'
import { formatPen, parsePenInput } from '../../../asientos/domain/journal.utils'
import { formatDate as formatCalendarDate } from '@shared/utils/formatters'
import { useExcelExport } from '@shared/presentation/composables/useExcelExport'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import {
  useContabilidadIncomeTaxExport,
  useContabilidadIncomeTaxDetail,
  useContabilidadUpsertIncomeTaxPeriod,
} from '../composables/useContabilidadIncomeTax'
import ContabilidadIncomeTaxTrendChart from '../components/ContabilidadIncomeTaxTrendChart.vue'
const fetchContabilidadIncomeTaxExport = useContabilidadIncomeTaxExport()

const router = useRouter()
const { activePeriod } = useContabilidadActivePeriod()
const periodId = computed(() => activePeriod.value?.id)
const periodOpen = computed(() => activePeriod.value?.status === 'OPEN')

const activeTab = ref('resumen')
const tabs = [
  { id: 'resumen', label: 'Resumen', icon: 'lucide:layout-dashboard' },
  { id: 'pagos', label: 'Pagos a cuenta', icon: 'lucide:wallet' },
  { id: 'retenciones', label: 'Retenciones', icon: 'lucide:receipt' },
  { id: 'ajustes', label: 'Ajustes', icon: 'lucide:sliders-horizontal' },
]

const { data, isLoading } = useContabilidadIncomeTaxDetail(periodId)
const detail = computed(() => data.value)

const periodLabel = computed(() => {
  if (!detail.value) {
    if (!activePeriod.value) return '—'
    return `${activePeriod.value.year}-${String(activePeriod.value.month).padStart(2, '0')}`
  }
  return `${detail.value.year}-${String(detail.value.month).padStart(2, '0')}`
})

const trendChartData = computed(() =>
  (detail.value?.monthlyTrend ?? []).map((m) => ({
    label: m.label,
    value: Number(m.accumulatedNetIncome) || 0,
  })),
)

const trendTaxData = computed(() =>
  (detail.value?.monthlyTrend ?? []).map((m) => ({
    label: m.label,
    value: Number(m.estimatedTax) || 0,
  })),
)

const adjustmentsDraft = ref({
  deductibleAdjustments: '',
  nonDeductibleAdjustments: '',
  otherIncomeAdjustments: '',
  otherExpenseAdjustments: '',
  advancePaymentAmount: '',
  notes: '',
})

watch(
  () => detail.value?.adjustments,
  (adj) => {
    if (!adj) return
    adjustmentsDraft.value = {
      deductibleAdjustments: adj.deductibleAdjustments === '0.00' ? '' : adj.deductibleAdjustments,
      nonDeductibleAdjustments:
        adj.nonDeductibleAdjustments === '0.00' ? '' : adj.nonDeductibleAdjustments,
      otherIncomeAdjustments:
        adj.otherIncomeAdjustments === '0.00' ? '' : adj.otherIncomeAdjustments,
      otherExpenseAdjustments:
        adj.otherExpenseAdjustments === '0.00' ? '' : adj.otherExpenseAdjustments,
      advancePaymentAmount: adj.advancePaymentAmount === '0.00' ? '' : adj.advancePaymentAmount,
      notes: adj.notes ?? '',
    }
  },
  { immediate: true },
)

const { mutate: saveAdjustments, isPending: saving } = useContabilidadUpsertIncomeTaxPeriod()
const { exportToExcel, isExporting } = useExcelExport()
const exportingDraft = ref(false)

function goTo(path: string) {
  void router.push(path)
}

function saveDraft() {
  if (!periodId.value || !periodOpen.value) return

  const fields = [
    { key: 'deductibleAdjustments' as const, label: 'Gastos deducibles adicionales' },
    { key: 'nonDeductibleAdjustments' as const, label: 'Gastos no deducibles' },
    { key: 'otherIncomeAdjustments' as const, label: 'Otros ingresos' },
    { key: 'otherExpenseAdjustments' as const, label: 'Otros gastos' },
    { key: 'advancePaymentAmount' as const, label: 'Pago a cuenta del periodo' },
  ]

  const body: Record<string, number | string | null> = {
    notes: adjustmentsDraft.value.notes.trim() || null,
  }

  for (const field of fields) {
    const raw = adjustmentsDraft.value[field.key].trim()
    if (!raw) {
      body[field.key] = 0
      continue
    }
    const n = parsePenInput(raw)
    if (Number.isNaN(n)) {
      void markapAlert.toast.error(`${field.label}: monto inválido`)
      return
    }
    body[field.key] = n
  }

  saveAdjustments({ periodId: periodId.value, body })
}

async function exportDraft() {
  if (!activePeriod.value) return
  exportingDraft.value = true
  try {
    const payload = await fetchContabilidadIncomeTaxExport(activePeriod.value.id)
    const d = payload.detail
    const periodStr = `${payload.year}-${String(payload.month).padStart(2, '0')}`

    await exportToExcel({
      fileName: `IR_borrador_${periodStr}_${payload.ruc}`,
      sheetName: 'Resumen IR',
      columns: [
        { header: 'Campo', key: 'field', width: 40 },
        { header: 'Valor', key: 'value', width: 24 },
      ],
      rows: [
        { field: 'RUC', value: payload.ruc },
        { field: 'Razón social', value: payload.legalName },
        { field: 'Periodo', value: periodStr },
        { field: 'Tasa IR %', value: d.incomeTaxRatePercent },
        { field: 'Ingresos del periodo', value: d.totalIncome },
        { field: 'Gastos del periodo', value: d.totalExpenses },
        { field: 'Resultado antes de renta', value: d.netIncomeBeforeTax },
        { field: 'Base imponible estimada', value: d.taxableBase },
        { field: 'Impuesto estimado', value: d.estimatedTaxProvision },
        { field: 'Resultado acumulado (YTD)', value: d.ytdNetIncome },
        { field: 'Base imponible YTD', value: d.ytdTaxableBase },
        { field: 'Impuesto estimado YTD', value: d.ytdEstimatedTax },
        { field: 'Saldo cuenta 4012', value: d.rentaAccountBalance },
        { field: 'Retenciones periodo', value: d.retentionsPeriodTotal },
        { field: 'Retenciones YTD', value: d.retentionsYtdTotal },
        { field: 'Pagos a cuenta YTD', value: d.advancePaymentsYtd },
        { field: 'Saldo neto impuesto YTD', value: d.netTaxBalanceYtd },
        { field: 'Ajuste deducible', value: d.adjustments.deductibleAdjustments },
        { field: 'Ajuste no deducible', value: d.adjustments.nonDeductibleAdjustments },
        { field: 'Otros ingresos', value: d.adjustments.otherIncomeAdjustments },
        { field: 'Otros gastos', value: d.adjustments.otherExpenseAdjustments },
        { field: 'Pago a cuenta periodo', value: d.adjustments.advancePaymentAmount },
        { field: 'Notas', value: d.adjustments.notes ?? '' },
        { field: 'Generado', value: payload.generatedAt },
      ],
      additionalSheets:
        d.retentionsPeriod.length > 0
          ? [
              {
                sheetName: 'Retenciones renta',
                columns: [
                  { header: 'Fecha', key: 'issueDate', width: 14 },
                  { header: 'RUC', key: 'counterpartyRuc', width: 14 },
                  { header: 'Proveedor', key: 'counterpartyName', width: 28 },
                  { header: 'Documento', key: 'documentRef', width: 18 },
                  { header: 'Base', key: 'taxableBase', width: 14 },
                  { header: 'Tasa %', key: 'ratePercent', width: 10 },
                  { header: 'Retención', key: 'amount', width: 14 },
                ],
                rows: d.retentionsPeriod.map((r) => ({
                  issueDate: r.issueDate,
                  counterpartyRuc: r.counterpartyRuc,
                  counterpartyName: r.counterpartyName,
                  documentRef: r.documentRef ?? '',
                  taxableBase: r.taxableBase,
                  ratePercent: r.ratePercent,
                  amount: r.amount,
                })),
              },
            ]
          : undefined,
    })

    void markapAlert.toast.success('Borrador IR exportado')
  } catch {
    void markapAlert.toast.error('No se pudo exportar')
  } finally {
    exportingDraft.value = false
  }
}

function formatTrendThousands(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`
  return String(Math.round(value))
}

function formatDate(iso: string) {
  return formatCalendarDate(iso, { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>

<template>
  <div class="w-full space-y-6">
    <PageHeader
      icon="lucide:landmark"
      title="Impuesto a la renta"
      :subtitle="`Borrador del periodo ${periodLabel} — régimen general (${detail?.incomeTaxRatePercent ?? '29.5'}%).`"
    >
      <template #actions>
        <div class="flex flex-wrap gap-2">
          <BaseButton variant="ghost" size="sm" @click="goTo('/contabilidad/reportes/estado-resultados')">
            <AppIcon icon="lucide:trending-up" :size="16" class="mr-1" />
            Estado de resultados
          </BaseButton>
          <BaseButton variant="ghost" size="sm" @click="goTo('/contabilidad/plan-cuentas')">
            <AppIcon icon="lucide:list-tree" :size="16" class="mr-1" />
            Cuenta 4012
          </BaseButton>
          <BaseButton
            variant="secondary"
            :disabled="!activePeriod"
            :loading="isExporting || exportingDraft"
            @click="exportDraft"
          >
            <AppIcon icon="lucide:file-spreadsheet" :size="16" class="mr-1" />
            Exportar borrador
          </BaseButton>
        </div>
      </template>
    </PageHeader>

    <div
      v-if="!activePeriod"
      class="rounded-xl border p-6 text-sm text-center border-gray-200 dark:border-gray-800 text-gray-400 dark:text-gray-500"
    >
      Seleccione un periodo contable activo.
    </div>

    <LoadingState v-else-if="isLoading" />

    <template v-else-if="detail">
      <BaseTabs v-model="activeTab" :tabs="tabs" />

      <template v-if="activeTab === 'resumen'">
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Ingresos del periodo" :value="formatPen(detail.totalIncome)" />
          <StatsCard title="Gastos del periodo" :value="formatPen(detail.totalExpenses)" />
          <StatsCard title="Resultado antes de renta" :value="formatPen(detail.netIncomeBeforeTax)" />
          <StatsCard title="Base imponible estimada" :value="formatPen(detail.taxableBase)" />
          <StatsCard title="Impuesto estimado" :value="formatPen(detail.estimatedTaxProvision)" />
          <StatsCard title="Saldo cuenta 4012" :value="formatPen(detail.rentaAccountBalance)" />
          <StatsCard title="Retenciones YTD" :value="formatPen(detail.retentionsYtdTotal)" />
          <StatsCard title="Saldo neto impuesto YTD" :value="formatPen(detail.netTaxBalanceYtd)" />
        </div>

        <div class="grid gap-4 lg:grid-cols-2">
          <ContabilidadIncomeTaxTrendChart
            title="Resultado acumulado (YTD)"
            subtitle="Evolución mensual del ejercicio"
            :data="trendChartData"
            color="var(--color-primary)"
            :value-formatter="formatTrendThousands"
          />
          <ContabilidadIncomeTaxTrendChart
            title="Impuesto estimado mensual"
            subtitle="Provisión referencial por periodo"
            :data="trendTaxData"
            color="var(--color-warning, #d97706)"
            :value-formatter="formatTrendThousands"
          />
        </div>

        <BaseCard padding="none" class="block overflow-hidden">
          <Table class="w-full text-sm">
            <TableHeader>
              <TableRow class="border-b border-gray-200 dark:border-gray-800">
                <TableCell is-header class="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Concepto</TableCell>
                <TableCell is-header class="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Periodo</TableCell>
                <TableCell is-header class="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Acumulado año</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow class="border-b border-gray-200 dark:border-gray-800">
                <TableCell class="py-2.5 px-4">Resultado / base imponible</TableCell>
                <TableCell class="py-2.5 px-4 text-right font-mono">{{ formatPen(detail.taxableBase) }}</TableCell>
                <TableCell class="py-2.5 px-4 text-right font-mono">{{ formatPen(detail.ytdTaxableBase) }}</TableCell>
              </TableRow>
              <TableRow class="border-b border-gray-200 dark:border-gray-800">
                <TableCell class="py-2.5 px-4">Impuesto estimado ({{ detail.incomeTaxRatePercent }}%)</TableCell>
                <TableCell class="py-2.5 px-4 text-right font-mono">{{ formatPen(detail.estimatedTaxProvision) }}</TableCell>
                <TableCell class="py-2.5 px-4 text-right font-mono">{{ formatPen(detail.ytdEstimatedTax) }}</TableCell>
              </TableRow>
              <TableRow class="border-b border-gray-200 dark:border-gray-800">
                <TableCell class="py-2.5 px-4">Retenciones renta</TableCell>
                <TableCell class="py-2.5 px-4 text-right font-mono">{{ formatPen(detail.retentionsPeriodTotal) }}</TableCell>
                <TableCell class="py-2.5 px-4 text-right font-mono">{{ formatPen(detail.retentionsYtdTotal) }}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell class="py-2.5 px-4 font-medium">Pagos a cuenta acumulados</TableCell>
                <TableCell class="py-2.5 px-4 text-right font-mono">{{ formatPen(detail.adjustments.advancePaymentAmount) }}</TableCell>
                <TableCell class="py-2.5 px-4 text-right font-mono">{{ formatPen(detail.advancePaymentsYtd) }}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </BaseCard>

        <p class="text-xs text-gray-400 dark:text-gray-500">
          Borrador estimativo para revisión interna. No sustituye la declaración anual ni el envío a SUNAT.
        </p>
      </template>

      <template v-else-if="activeTab === 'pagos'">
        <BaseCard class="block space-y-4 max-w-xl">
          <div>
            <h3 class="font-medium text-sm text-gray-800 dark:text-white/90">Pago a cuenta del periodo</h3>
            <p class="text-xs mt-1 text-gray-400 dark:text-gray-500">
              Registre el pago a cuenta declarado para este mes. Se acumula en el cálculo YTD.
            </p>
          </div>
          <FormInput
            v-model="adjustmentsDraft.advancePaymentAmount"
            label="Monto (S/)"
            type="text"
            inputmode="decimal"
            placeholder="0.00"
            :disabled="!periodOpen"
          />
          <p class="text-sm">
            <span class="text-gray-400 dark:text-gray-500">Acumulado pagos a cuenta (YTD):</span>
            <strong class="ml-2 font-mono">{{ formatPen(detail.advancePaymentsYtd) }}</strong>
          </p>
          <BaseButton
            v-if="(periodOpen) && canWrite"
            :loading="saving"
            @click="saveDraft"
          >
            Guardar pago a cuenta
          </BaseButton>
          <p v-else class="text-xs text-warning-600 dark:text-orange-400">
            El periodo está cerrado; no se pueden modificar los pagos a cuenta.
          </p>
        </BaseCard>
      </template>

      <template v-else-if="activeTab === 'retenciones'">
        <BaseCard padding="none" class="block overflow-hidden">
          <div
            class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800"
          >
            <p class="text-sm font-medium text-gray-800 dark:text-white/90">
              Retenciones renta del periodo
            </p>
            <span class="text-sm font-mono font-semibold">{{ formatPen(detail.retentionsPeriodTotal) }}</span>
          </div>

          <div v-if="detail.retentionsPeriod.length === 0" class="p-8 text-center text-sm text-gray-400 dark:text-gray-500">
            No hay retenciones de renta registradas en este periodo.
          </div>

          <DataTable
            :columns="[
              { key: 'c0', label: 'Fecha' },
              { key: 'c1', label: 'Proveedor' },
              { key: 'c2', label: 'Documento' },
              { key: 'c3', label: 'Base', align: 'right' },
              { key: 'c4', label: 'Retención', align: 'right' },
            ]"
            :data="detail.retentionsPeriod"
          >
            <template #row="{ row }">
                <td class="py-2 px-4 whitespace-nowrap">{{ formatDate(row.issueDate) }}</td>
                <td class="py-2 px-4">
                  <div class="font-mono text-xs text-gray-400 dark:text-gray-500">{{ row.counterpartyRuc }}</div>
                  <div>{{ row.counterpartyName }}</div>
                </td>
                <td class="py-2 px-4 hidden md:table-cell">{{ row.documentRef ?? '—' }}</td>
                <td class="py-2 px-4 text-right font-mono">{{ formatPen(row.taxableBase) }}</td>
                <td class="py-2 px-4 text-right font-mono font-medium">{{ formatPen(row.amount) }}</td>
            </template>
          </DataTable>
        </BaseCard>

        <p class="text-xs text-gray-400 dark:text-gray-500">
          Total retenciones acumuladas en el año: {{ formatPen(detail.retentionsYtdTotal) }}.
          Las retenciones se registran en
          <BaseButton @click="goTo('/contabilidad/tributos/retenciones')" variant="link">Tributos → Retenciones</BaseButton>.
        </p>
      </template>

      <template v-else-if="activeTab === 'ajustes'">
        <BaseCard class="block space-y-5 max-w-2xl">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Ajustes manuales sobre el resultado del estado de resultados para estimar la base imponible.
          </p>

          <div class="grid gap-4 sm:grid-cols-2">
            <FormInput
              v-model="adjustmentsDraft.deductibleAdjustments"
              label="Gastos deducibles adicionales (S/)"
              type="text"
              inputmode="decimal"
              placeholder="0.00"
              :disabled="!periodOpen"
            />
            <FormInput
              v-model="adjustmentsDraft.nonDeductibleAdjustments"
              label="Gastos no deducibles (S/)"
              type="text"
              inputmode="decimal"
              placeholder="0.00"
              :disabled="!periodOpen"
            />
            <FormInput
              v-model="adjustmentsDraft.otherIncomeAdjustments"
              label="Otros ingresos gravables (S/)"
              type="text"
              inputmode="decimal"
              placeholder="0.00"
              :disabled="!periodOpen"
            />
            <FormInput
              v-model="adjustmentsDraft.otherExpenseAdjustments"
              label="Otros gastos deducibles (S/)"
              type="text"
              inputmode="decimal"
              placeholder="0.00"
              :disabled="!periodOpen"
            />
          </div>

          <FormTextarea
            v-model="adjustmentsDraft.notes"
            label="Notas / observaciones"
            :rows="3"
            placeholder="Referencias a sustentos, criterios o pendientes de revisión…"
            :disabled="!periodOpen"
          />

          <div
            class="rounded-lg border p-4 text-sm space-y-1 border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800"
          >
            <div class="flex justify-between">
              <span class="text-gray-400 dark:text-gray-500">Resultado antes de renta</span>
              <span class="font-mono">{{ formatPen(detail.netIncomeBeforeTax) }}</span>
            </div>
            <div class="flex justify-between font-medium">
              <span>Base imponible estimada</span>
              <span class="font-mono">{{ formatPen(detail.taxableBase) }}</span>
            </div>
          </div>

          <BaseButton v-if="(periodOpen) && canWrite" :loading="saving" @click="saveDraft">
            Guardar ajustes
          </BaseButton>
          <p v-else class="text-xs text-warning-600 dark:text-orange-400">
            El periodo está cerrado; los ajustes no pueden modificarse.
          </p>
        </BaseCard>
      </template>
    </template>
  </div>
</template>
