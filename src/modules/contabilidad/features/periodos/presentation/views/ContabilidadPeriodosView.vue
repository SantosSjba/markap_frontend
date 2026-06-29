<script setup lang="ts">
import { ref, computed } from 'vue'
import { BaseButton, AppIcon } from '@shared/components'
import { markapAlert } from '@/shared/composables'
import {
  useContabilidadPeriodsList,
  useContabilidadSetPeriodStatus,
} from '../../application/useContabilidadPeriods'
import { CONTABILIDAD_PERIOD_STATUS_LABELS } from '../../domain/period.types'
import type { ContabilidadPeriodDTO } from '../../domain/period.types'

const selectedYear = ref(new Date().getFullYear())

const { data, isLoading, isError, refetch } = useContabilidadPeriodsList(selectedYear)
const { mutate: setStatus, isPending: updating } = useContabilidadSetPeriodStatus()

const periods = computed(() => data.value?.periods ?? [])

function changeYear(delta: number) {
  selectedYear.value += delta
}

async function togglePeriod(period: ContabilidadPeriodDTO) {
  const next = period.status === 'OPEN' ? 'CLOSED' : 'OPEN'
  const ok =
    next === 'CLOSED'
      ? await markapAlert.confirm({
          title: `¿Cerrar ${period.label}?`,
          text: 'No se podrán registrar asientos en este periodo (cierre suave).',
          confirmText: 'Cerrar periodo',
        })
      : true
  if (!ok) return
  setStatus(
    { id: period.id, status: next },
    { onSuccess: () => void refetch() },
  )
}
</script>

<template>
  <div class="px-3 sm:px-5 py-6 sm:py-8 space-y-6 max-w-[1600px] mx-auto">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-xl font-bold" :style="{ color: 'var(--color-text-primary)' }">
          Periodos contables
        </h1>
        <p class="text-sm mt-1" :style="{ color: 'var(--color-text-secondary)' }">
          Apertura y cierre mensual. Los 12 meses del año se generan automáticamente.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <BaseButton variant="ghost" size="sm" @click="changeYear(-1)">
          <AppIcon icon="lucide:chevron-left" :size="18" />
        </BaseButton>
        <span class="text-lg font-semibold min-w-[4rem] text-center" :style="{ color: 'var(--color-text-primary)' }">
          {{ selectedYear }}
        </span>
        <BaseButton variant="ghost" size="sm" @click="changeYear(1)">
          <AppIcon icon="lucide:chevron-right" :size="18" />
        </BaseButton>
      </div>
    </div>

    <div v-if="isLoading" class="flex justify-center py-16">
      <AppIcon icon="svg-spinners:ring-resize" :size="32" color="var(--color-primary)" />
    </div>

    <div
      v-else-if="isError"
      class="rounded-xl border p-8 text-center"
      :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
    >
      <BaseButton variant="secondary" @click="refetch()">Reintentar</BaseButton>
    </div>

    <div
      v-else
      class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      <div
        v-for="period in periods"
        :key="period.id"
        class="rounded-xl border p-4 flex flex-col gap-3"
        :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
      >
        <div class="flex items-start justify-between gap-2">
          <div>
            <p class="font-semibold" :style="{ color: 'var(--color-text-primary)' }">{{ period.label }}</p>
            <p class="text-xs mt-0.5" :style="{ color: 'var(--color-text-muted)' }">
              Mes {{ period.month }} / {{ period.year }}
            </p>
          </div>
          <span
            class="text-xs px-2 py-0.5 rounded-full shrink-0"
            :style="{
              backgroundColor: period.status === 'OPEN' ? 'var(--color-primary-soft)' : 'var(--color-surface-elevated)',
              color: period.status === 'OPEN' ? 'var(--color-primary)' : 'var(--color-text-muted)',
            }"
          >
            {{ CONTABILIDAD_PERIOD_STATUS_LABELS[period.status as keyof typeof CONTABILIDAD_PERIOD_STATUS_LABELS] }}
          </span>
        </div>
        <BaseButton
          variant="secondary"
          size="sm"
          :loading="updating"
          @click="togglePeriod(period)"
        >
          {{ period.status === 'OPEN' ? 'Cerrar periodo' : 'Reabrir periodo' }}
        </BaseButton>
      </div>
    </div>
  </div>
</template>
