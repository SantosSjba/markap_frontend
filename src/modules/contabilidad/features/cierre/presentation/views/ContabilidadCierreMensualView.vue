<script setup lang="ts">
import FormSectionCard from '@shared/presentation/components/forms/FormSectionCard.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import DataTable from '@shared/presentation/components/ui/DataTable.vue'
import { computed } from 'vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { useContabilidadActivePeriod } from '../../../../presentation/composables/useContabilidadActivePeriod'
import { formatPen } from '../../../asientos/domain/journal.utils'
import {
  useContabilidadClosingPreview,
  useContabilidadClosePeriod,
} from '../composables/useContabilidadClosing'
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
  <div class="w-full space-y-6">
    <PageHeader
      icon="lucide:lock"
      title="Cierre mensual"
      subtitle="Checklist de validación y cierre del periodo activo"
    />

    <p v-if="!activePeriod" class="text-sm text-warning-600 dark:text-orange-400">
      Configure el periodo activo en Configuración → Contexto contable.
    </p>

    <LoadingState v-if="isLoading" />

    <template v-else-if="data">
      <FormSectionCard
        title="Checklist pre-cierre"
        dense
      >
        <ul class="space-y-2">
          <li
            v-for="item in data.checklist"
            :key="item.id"
            class="flex items-start gap-3 text-sm"
          >
            <AppIcon :icon="statusIcon[item.status]" :size="20" :color="statusColor[item.status]" />
            <div>
              <p class="font-medium">{{ item.label }}</p>
              <p class="text-gray-500 dark:text-gray-400">{{ item.message }}</p>
            </div>
          </li>
        </ul>
      </FormSectionCard>

      <div class="grid gap-4 sm:grid-cols-2">
        <FormSectionCard
          title="Balance general (vista previa)"
          dense
        >
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
        </FormSectionCard>
        <FormSectionCard
          title="Estado de resultados (vista previa)"
          subtitle="Utilidad neta del periodo"
          dense
        >
          <p class="font-mono font-bold text-xl mt-1">
            {{ formatPen(data.incomeStatementPreview.netIncome) }}
          </p>
        </FormSectionCard>
      </div>

      <FormSectionCard
        v-if="data.regularizationPreview?.required"
        title="Asiento de regularización (vista previa)"
        dense
      >
        <div class="space-y-3">
          <p v-if="data.regularizationPreview.description" class="text-sm text-gray-500 dark:text-gray-400">
          {{ data.regularizationPreview.description }}
        </p>
          <dl class="grid gap-2 sm:grid-cols-3 text-sm">
          <div>
            <dt class="text-gray-500 dark:text-gray-400">Total gastos (clase 6)</dt>
            <dd class="font-mono font-semibold">{{ formatPen(data.regularizationPreview.expenseTotal) }}</dd>
          </div>
          <div>
            <dt class="text-gray-500 dark:text-gray-400">Total ingresos (clase 7)</dt>
            <dd class="font-mono font-semibold">{{ formatPen(data.regularizationPreview.incomeTotal) }}</dd>
          </div>
          <div>
            <dt class="text-gray-500 dark:text-gray-400">Resultado a regularizar</dt>
            <dd class="font-mono font-semibold">{{ formatPen(data.regularizationPreview.netAmount) }}</dd>
          </div>
        </dl>
          <div v-if="data.regularizationPreview.lines.length" class="overflow-x-auto">
          <DataTable
            :columns="[
              { key: 'c0', label: 'Cuenta' },
              { key: 'c1', label: 'Nombre' },
              { key: 'c2', label: 'Debe', align: 'right' },
              { key: 'c3', label: 'Haber', align: 'right' },
            ]"
            :data="data.regularizationPreview.lines"
          >
            <template #row="{ row: line }">
                <td class="py-2 px-3 font-mono">{{ line.accountCode }}</td>
                <td class="py-2 px-3">{{ line.accountName }}</td>
                <td class="py-2 px-3 text-right font-mono">{{ formatPen(line.debit) }}</td>
                <td class="py-2 px-3 text-right font-mono">{{ formatPen(line.credit) }}</td>
            </template>
          </DataTable>
        </div>
        </div>
      </FormSectionCard>

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
