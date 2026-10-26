<script setup lang="ts">
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@shared/presentation/ui/table'
import { computed, ref } from 'vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import StatsCard from '@shared/presentation/components/ui/StatsCard.vue'
import { useContabilidadActivePeriod } from '../../../../presentation/composables/useContabilidadActivePeriod'
import { formatPen } from '../../../asientos/domain/journal.utils'
import { useExcelExport } from '@shared/presentation/composables/useExcelExport'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import {
  useContabilidadTaxDashboard,
  useFetchContabilidadPdt621Export,
} from '../composables/useContabilidadTaxes'
const fetchContabilidadPdt621Export = useFetchContabilidadPdt621Export()

const { activePeriod } = useContabilidadActivePeriod()
const periodId = computed(() => activePeriod.value?.id)

const { data, isLoading } = useContabilidadTaxDashboard(periodId)
const summary = computed(() => data.value?.summary)
const { exportToExcel, isExporting } = useExcelExport()

const exportingPdt = ref(false)

async function exportPdt621() {
  if (!activePeriod.value) return
  exportingPdt.value = true
  try {
    const payload = await fetchContabilidadPdt621Export(activePeriod.value.id)
    const s = payload.igvSummary
    await exportToExcel({
      fileName: `PDT621_${payload.year}-${String(payload.month).padStart(2, '0')}_${payload.ruc}`,
      sheetName: 'Resumen IGV',
      columns: [
        { header: 'Campo', key: 'field', width: 36 },
        { header: 'Valor', key: 'value', width: 24 },
      ],
      rows: [
        { field: 'RUC', value: payload.ruc },
        { field: 'Razón social', value: payload.legalName },
        { field: 'Periodo', value: `${payload.year}-${String(payload.month).padStart(2, '0')}` },
        { field: 'IGV %', value: s.igvPercent },
        { field: 'Crédito fiscal compras', value: s.purchaseCreditIgv },
        { field: 'NC compras (reduce crédito)', value: s.purchaseCreditNoteIgv },
        { field: 'Débito fiscal ventas', value: s.salesDebitIgv },
        { field: 'NC ventas (reduce débito)', value: s.salesCreditNoteIgv },
        { field: 'Retenciones IGV', value: s.retentionsIgv },
        { field: 'Percepciones IGV', value: s.perceptionsIgv },
        { field: 'Crédito neto', value: s.netCreditIgv },
        { field: 'Débito neto', value: s.netDebitIgv },
        { field: 'Saldo a pagar', value: s.balanceToPay },
        { field: 'Saldo a favor', value: s.balanceInFavor },
        { field: 'Detracciones pagadas', value: payload.detraccionesTotal },
        { field: 'Retenciones', value: payload.retencionesTotal },
        { field: 'Percepciones', value: payload.percepcionesTotal },
      ],
    })
    void markapAlert.toast.success('Export PDT 621 generado')
  } catch {
    void markapAlert.toast.error('No se pudo exportar')
  } finally {
    exportingPdt.value = false
  }
}
</script>

<template>
  <div class="w-full space-y-6">
    <PageHeader
      icon="lucide:percent"
      title="IGV del periodo"
      subtitle="Crédito fiscal (compras) vs débito fiscal (ventas). Cuenta 4011."
    >
      <template #actions>
        <BaseButton
          variant="secondary"
          :disabled="!activePeriod"
          :loading="isExporting || exportingPdt"
          @click="exportPdt621"
        >
          <AppIcon icon="lucide:file-spreadsheet" :size="16" class="mr-1" />
          Exportar PDT 621
        </BaseButton>
      </template>
    </PageHeader>

    <p v-if="!activePeriod" class="text-sm text-warning-600 dark:text-orange-400">
      Configure el periodo activo en Configuración ? Contexto contable.
    </p>

    <LoadingState v-else-if="isLoading" />

    <template v-else-if="summary">
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Crédito fiscal (compras)" :value="formatPen(summary.purchaseCreditIgv)">
          <template #icon><AppIcon icon="lucide:arrow-down-left" :size="20" /></template>
        </StatsCard>
        <StatsCard title="Débito fiscal (ventas)" :value="formatPen(summary.salesDebitIgv)">
          <template #icon><AppIcon icon="lucide:arrow-up-right" :size="20" /></template>
        </StatsCard>
        <StatsCard title="Saldo a pagar" :value="formatPen(summary.balanceToPay)">
          <template #icon><AppIcon icon="lucide:wallet" :size="20" /></template>
        </StatsCard>
        <StatsCard title="Saldo a favor" :value="formatPen(summary.balanceInFavor)">
          <template #icon><AppIcon icon="lucide:piggy-bank" :size="20" /></template>
        </StatsCard>
      </div>

      <BaseCard padding="none" class="block overflow-hidden">
        <Table class="w-full text-sm">
          <TableHeader>
            <TableRow class="border-b border-gray-200 dark:border-gray-800">
              <TableCell is-header class="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Concepto</TableCell>
              <TableCell is-header class="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Importe (S/)</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow class="border-b border-gray-200 dark:border-gray-800">
              <TableCell class="py-2.5 px-4">IGV compras (crédito)</TableCell>
              <TableCell class="py-2.5 px-4 text-right font-mono">{{ formatPen(summary.purchaseCreditIgv) }}</TableCell>
            </TableRow>
            <TableRow class="border-b border-gray-200 dark:border-gray-800">
              <TableCell class="py-2.5 px-4 pl-8 text-sm text-gray-400 dark:text-gray-500">Menos NC compras</TableCell>
              <TableCell class="py-2.5 px-4 text-right font-mono text-sm">− {{ formatPen(summary.purchaseCreditNoteIgv) }}</TableCell>
            </TableRow>
            <TableRow class="border-b border-gray-200 dark:border-gray-800">
              <TableCell class="py-2.5 px-4">Retenciones IGV (a favor)</TableCell>
              <TableCell class="py-2.5 px-4 text-right font-mono">+ {{ formatPen(summary.retentionsIgv) }}</TableCell>
            </TableRow>
            <TableRow class="border-b font-medium border-gray-200 dark:border-gray-800">
              <TableCell class="py-2.5 px-4">Crédito neto</TableCell>
              <TableCell class="py-2.5 px-4 text-right font-mono">{{ formatPen(summary.netCreditIgv) }}</TableCell>
            </TableRow>
            <TableRow class="border-b border-gray-200 dark:border-gray-800">
              <TableCell class="py-2.5 px-4">IGV ventas (débito)</TableCell>
              <TableCell class="py-2.5 px-4 text-right font-mono">{{ formatPen(summary.salesDebitIgv) }}</TableCell>
            </TableRow>
            <TableRow class="border-b border-gray-200 dark:border-gray-800">
              <TableCell class="py-2.5 px-4 pl-8 text-sm text-gray-400 dark:text-gray-500">Menos NC ventas</TableCell>
              <TableCell class="py-2.5 px-4 text-right font-mono text-sm">− {{ formatPen(summary.salesCreditNoteIgv) }}</TableCell>
            </TableRow>
            <TableRow class="border-b border-gray-200 dark:border-gray-800">
              <TableCell class="py-2.5 px-4">Percepciones IGV</TableCell>
              <TableCell class="py-2.5 px-4 text-right font-mono">+ {{ formatPen(summary.perceptionsIgv) }}</TableCell>
            </TableRow>
            <TableRow class="border-b font-medium border-gray-200 dark:border-gray-800">
              <TableCell class="py-2.5 px-4">Débito neto</TableCell>
              <TableCell class="py-2.5 px-4 text-right font-mono">{{ formatPen(summary.netDebitIgv) }}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell class="py-3 px-4 font-semibold">Resultado (débito − crédito)</TableCell>
              <TableCell class="py-3 px-4 text-right font-mono font-bold text-lg">
                {{ formatPen(summary.balanceToPay !== '0.00' ? summary.balanceToPay : `-${summary.balanceInFavor}`) }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </BaseCard>

      <p class="text-xs text-gray-400 dark:text-gray-500">
        Tasa IGV configurada: {{ data?.igvPercent }}%. Los montos provienen de compras/ventas registradas en el periodo.
      </p>
    </template>
  </div>
</template>
