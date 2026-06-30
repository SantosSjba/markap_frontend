<script setup lang="ts">
import { computed } from 'vue'
import { AppIcon, BaseButton, PageHeader } from '@shared/components'
import { markapAlert } from '@/shared/composables'
import { useContabilidadActivePeriod } from '@modules/contabilidad/presentation/composables/useContabilidadActivePeriod'
import { formatPen } from '@modules/contabilidad/features/asientos/domain/journal.utils'
import {
  useContabilidadClosingPreview,
  useContabilidadClosePeriod,
} from '../../application/useContabilidadClosing'
import type { ClosingCheckStatus } from '../../domain/closing.types'

const { activePeriod, loadPeriods } = useContabilidadActivePeriod()
const periodId = computed(() => activePeriod.value?.id)

const { data, isLoading, refetch } = useContabilidadClosingPreview(periodId)
const { mutate: closePeriod, isPending: closing } = useContabilidadClosePeriod()

const statusIcon: Record<ClosingCheckStatus, string> = {
  ok: 'lucide:circle-check',
  warning: 'lucide:triangle-alert',
  error: 'lucide:circle-x',
}

const statusColor: Record<ClosingCheckStatus, string> = {
  ok: 'var(--color-success)',
  warning: 'var(--color-warning)',
  error: 'var(--color-danger)',
}

async function onClose() {
  if (!periodId.value || !data.value?.canClose) return
  const ok = await markapAlert.confirm({
    title: '¿Cerrar periodo contable?',
    text: 'No se podrán registrar nuevos asientos en este mes.',
    confirmText: 'Cerrar periodo',
  })
  if (!ok) return
  closePeriod(periodId.value, {
    onSuccess: () => {
      void loadPeriods()
      void refetch()
    },
  })
}
</script>

<template>
  <div class="w-full px-3 sm:px-5 py-6 sm:py-8 space-y-6">
    <PageHeader
      icon="lucide:lock"
      title="Cierre mensual"
      subtitle="Checklist de validación y cierre del periodo activo"
    />

    <p v-if="!activePeriod" class="text-sm" :style="{ color: 'var(--color-warning)' }">
      Configure el periodo activo en Configuración → Contexto contable.
    </p>

    <div v-if="isLoading" class="flex justify-center py-16">
      <AppIcon icon="svg-spinners:ring-resize" :size="32" color="var(--color-primary)" />
    </div>

    <template v-else-if="data">
      <div
        class="rounded-xl border p-4 space-y-3"
        :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
      >
        <h2 class="font-semibold">Checklist pre-cierre</h2>
        <ul class="space-y-2">
          <li
            v-for="item in data.checklist"
            :key="item.id"
            class="flex items-start gap-3 text-sm"
          >
            <AppIcon :icon="statusIcon[item.status]" :size="20" :color="statusColor[item.status]" />
            <div>
              <p class="font-medium">{{ item.label }}</p>
              <p :style="{ color: 'var(--color-text-secondary)' }">{{ item.message }}</p>
            </div>
          </li>
        </ul>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <div
          class="rounded-xl border p-4"
          :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
        >
          <h3 class="text-sm font-semibold mb-2">Balance general (vista previa)</h3>
          <dl class="space-y-1 text-sm">
            <div class="flex justify-between">
              <dt>Activo</dt>
              <dd class="font-mono">{{ formatPen(data.balanceSheetPreview.totalAssets) }}</dd>
            </div>
            <div class="flex justify-between">
              <dt>Pasivo</dt>
              <dd class="font-mono">{{ formatPen(data.balanceSheetPreview.totalLiabilities) }}</dd>
            </div>
            <div class="flex justify-between">
              <dt>Patrimonio</dt>
              <dd class="font-mono">{{ formatPen(data.balanceSheetPreview.totalEquity) }}</dd>
            </div>
          </dl>
        </div>
        <div
          class="rounded-xl border p-4"
          :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
        >
          <h3 class="text-sm font-semibold mb-2">Estado de resultados (vista previa)</h3>
          <p class="text-sm" :style="{ color: 'var(--color-text-secondary)' }">Utilidad neta del periodo</p>
          <p class="font-mono font-bold text-xl mt-1">
            {{ formatPen(data.incomeStatementPreview.netIncome) }}
          </p>
        </div>
      </div>

      <div
        v-if="data.regularizationPreview?.required"
        class="rounded-xl border p-4 space-y-3"
        :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
      >
        <h3 class="text-sm font-semibold">Asiento de regularización (vista previa)</h3>
        <p v-if="data.regularizationPreview.description" class="text-sm" :style="{ color: 'var(--color-text-secondary)' }">
          {{ data.regularizationPreview.description }}
        </p>
        <dl class="grid gap-2 sm:grid-cols-3 text-sm">
          <div>
            <dt :style="{ color: 'var(--color-text-secondary)' }">Total gastos (clase 6)</dt>
            <dd class="font-mono font-semibold">{{ formatPen(data.regularizationPreview.expenseTotal) }}</dd>
          </div>
          <div>
            <dt :style="{ color: 'var(--color-text-secondary)' }">Total ingresos (clase 7)</dt>
            <dd class="font-mono font-semibold">{{ formatPen(data.regularizationPreview.incomeTotal) }}</dd>
          </div>
          <div>
            <dt :style="{ color: 'var(--color-text-secondary)' }">Resultado a regularizar</dt>
            <dd class="font-mono font-semibold">{{ formatPen(data.regularizationPreview.netAmount) }}</dd>
          </div>
        </dl>
        <div v-if="data.regularizationPreview.lines.length" class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b" :style="{ borderColor: 'var(--color-border)' }">
                <th class="text-left py-2 px-3 font-medium">Cuenta</th>
                <th class="text-left py-2 px-3 font-medium">Nombre</th>
                <th class="text-right py-2 px-3 font-medium">Debe</th>
                <th class="text-right py-2 px-3 font-medium">Haber</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(line, idx) in data.regularizationPreview.lines"
                :key="idx"
                class="border-b"
                :style="{ borderColor: 'var(--color-border)' }"
              >
                <td class="py-2 px-3 font-mono">{{ line.accountCode }}</td>
                <td class="py-2 px-3">{{ line.accountName }}</td>
                <td class="py-2 px-3 text-right font-mono">{{ formatPen(line.debit) }}</td>
                <td class="py-2 px-3 text-right font-mono">{{ formatPen(line.credit) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="flex flex-wrap gap-3">
        <BaseButton variant="secondary" @click="refetch()">Actualizar checklist</BaseButton>
        <BaseButton
          variant="primary"
          :disabled="!data.canClose || data.periodStatus === 'CLOSED' || closing"
          :loading="closing"
          @click="onClose"
        >
          {{ data.periodStatus === 'CLOSED' ? 'Periodo ya cerrado' : 'Cerrar periodo' }}
        </BaseButton>
      </div>
    </template>
  </div>
</template>
