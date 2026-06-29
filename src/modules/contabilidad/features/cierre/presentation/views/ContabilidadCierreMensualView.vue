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
  <div class="px-3 sm:px-5 py-6 sm:py-8 space-y-6 max-w-[960px] mx-auto">
    <PageHeader
      icon="lucide:lock"
      title="Cierre mensual"
      subtitle="Checklist de validación y cierre del periodo activo"
    />

    <p v-if="!activePeriod" class="text-sm" :style="{ color: 'var(--color-warning)' }">
      Seleccione un periodo activo en la barra superior.
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
