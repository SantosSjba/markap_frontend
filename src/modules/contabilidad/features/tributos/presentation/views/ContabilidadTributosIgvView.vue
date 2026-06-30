<script setup lang="ts">
import { computed, ref } from 'vue'
import { BaseButton, AppIcon, PageHeader, StatsCard } from '@shared/components'
import { useContabilidadActivePeriod } from '@modules/contabilidad/presentation/composables/useContabilidadActivePeriod'
import { formatPen } from '@modules/contabilidad/features/asientos/domain/journal.utils'
import { useExcelExport } from '@/shared/composables/useExcelExport'
import { markapAlert } from '@/shared/composables'
import { useContabilidadTaxDashboard, fetchContabilidadPdt621Export } from '../../application/useContabilidadTaxes'

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
  <div class="w-full px-3 sm:px-5 py-6 sm:py-8 space-y-6">
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

    <p v-if="!activePeriod" class="text-sm" :style="{ color: 'var(--color-warning)' }">
      Configure el periodo activo en Configuraci�n ? Contexto contable.
    </p>

    <div v-else-if="isLoading" class="flex justify-center py-16">
      <AppIcon icon="svg-spinners:ring-resize" :size="32" color="var(--color-primary)" />
    </div>

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

      <div
        class="rounded-xl border overflow-hidden"
        :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
      >
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b" :style="{ borderColor: 'var(--color-border)' }">
              <th class="text-left py-3 px-4 font-medium" :style="{ color: 'var(--color-text-secondary)' }">Concepto</th>
              <th class="text-right py-3 px-4 font-medium" :style="{ color: 'var(--color-text-secondary)' }">Importe (S/)</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-b" :style="{ borderColor: 'var(--color-border)' }">
              <td class="py-2.5 px-4">IGV compras (crédito)</td>
              <td class="py-2.5 px-4 text-right font-mono">{{ formatPen(summary.purchaseCreditIgv) }}</td>
            </tr>
            <tr class="border-b" :style="{ borderColor: 'var(--color-border)' }">
              <td class="py-2.5 px-4 pl-8 text-sm" :style="{ color: 'var(--color-text-muted)' }">Menos NC compras</td>
              <td class="py-2.5 px-4 text-right font-mono text-sm">− {{ formatPen(summary.purchaseCreditNoteIgv) }}</td>
            </tr>
            <tr class="border-b" :style="{ borderColor: 'var(--color-border)' }">
              <td class="py-2.5 px-4">Retenciones IGV (a favor)</td>
              <td class="py-2.5 px-4 text-right font-mono">+ {{ formatPen(summary.retentionsIgv) }}</td>
            </tr>
            <tr class="border-b font-medium" :style="{ borderColor: 'var(--color-border)' }">
              <td class="py-2.5 px-4">Crédito neto</td>
              <td class="py-2.5 px-4 text-right font-mono">{{ formatPen(summary.netCreditIgv) }}</td>
            </tr>
            <tr class="border-b" :style="{ borderColor: 'var(--color-border)' }">
              <td class="py-2.5 px-4">IGV ventas (débito)</td>
              <td class="py-2.5 px-4 text-right font-mono">{{ formatPen(summary.salesDebitIgv) }}</td>
            </tr>
            <tr class="border-b" :style="{ borderColor: 'var(--color-border)' }">
              <td class="py-2.5 px-4 pl-8 text-sm" :style="{ color: 'var(--color-text-muted)' }">Menos NC ventas</td>
              <td class="py-2.5 px-4 text-right font-mono text-sm">− {{ formatPen(summary.salesCreditNoteIgv) }}</td>
            </tr>
            <tr class="border-b" :style="{ borderColor: 'var(--color-border)' }">
              <td class="py-2.5 px-4">Percepciones IGV</td>
              <td class="py-2.5 px-4 text-right font-mono">+ {{ formatPen(summary.perceptionsIgv) }}</td>
            </tr>
            <tr class="border-b font-medium" :style="{ borderColor: 'var(--color-border)' }">
              <td class="py-2.5 px-4">Débito neto</td>
              <td class="py-2.5 px-4 text-right font-mono">{{ formatPen(summary.netDebitIgv) }}</td>
            </tr>
            <tr>
              <td class="py-3 px-4 font-semibold">Resultado (débito − crédito)</td>
              <td class="py-3 px-4 text-right font-mono font-bold text-lg">
                {{ formatPen(summary.balanceToPay !== '0.00' ? summary.balanceToPay : `-${summary.balanceInFavor}`) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p class="text-xs" :style="{ color: 'var(--color-text-muted)' }">
        Tasa IGV configurada: {{ data?.igvPercent }}%. Los montos provienen de compras/ventas registradas en el periodo.
      </p>
    </template>
  </div>
</template>
