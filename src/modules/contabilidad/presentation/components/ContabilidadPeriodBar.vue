<script setup lang="ts">
import { computed } from 'vue'
import { AppIcon, FormSelect } from '@shared/components'
import { useContabilidadActivePeriod } from '../composables/useContabilidadActivePeriod'
import { CONTABILIDAD_PERIOD_STATUS_LABELS } from '@modules/contabilidad/features/periodos/domain/period.types'

const { activePeriod, periods, loading, setActivePeriod, setListYear, listYear } =
  useContabilidadActivePeriod()

const yearOptions = computed(() =>
  [listYear.value - 1, listYear.value, listYear.value + 1].map((y) => ({
    value: y,
    label: String(y),
  })),
)

const periodOptions = computed(() =>
  periods.value.map((p) => ({
    value: p.id,
    label: `${p.label} — ${CONTABILIDAD_PERIOD_STATUS_LABELS[p.status]}`,
  })),
)

const selectedYear = computed({
  get: () => listYear.value,
  set: (value: string | number | null) => {
    const year = Number(value)
    if (Number.isFinite(year)) setListYear(year)
  },
})

const selectedPeriodId = computed({
  get: () => activePeriod.value?.id ?? '',
  set: (value: string | number | null) => {
    const period = periods.value.find((p) => p.id === value)
    if (period) setActivePeriod(period)
  },
})

const monthPlaceholder = computed(() => {
  if (loading.value) return 'Cargando…'
  if (!periods.value.length) return 'Sin periodos'
  return 'Seleccionar mes…'
})
</script>

<template>
  <div
    class="mb-4 rounded-xl border px-4 py-3 text-sm"
    :style="{
      borderColor: 'var(--color-border)',
      backgroundColor: 'var(--color-surface)',
    }"
  >
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
      <div
        class="flex items-center gap-2 shrink-0"
        :style="{ color: 'var(--color-text-secondary)' }"
      >
        <AppIcon icon="lucide:calendar-range" :size="16" color="var(--color-primary)" />
        <span class="font-medium">Periodo activo</span>
      </div>

      <div class="flex flex-1 flex-wrap items-center gap-x-4 gap-y-2 min-w-0">
        <div class="flex items-center gap-2 shrink-0">
          <span class="text-xs font-medium w-8 shrink-0" :style="{ color: 'var(--color-text-muted)' }">
            Año
          </span>
          <div class="w-[6.5rem] shrink-0">
            <FormSelect
              v-model="selectedYear"
              :options="yearOptions"
              :disabled="loading"
              :loading="loading"
            />
          </div>
        </div>

        <div class="flex items-center gap-2 min-w-0 flex-1 sm:max-w-md">
          <span class="text-xs font-medium w-8 shrink-0" :style="{ color: 'var(--color-text-muted)' }">
            Mes
          </span>
          <div class="min-w-0 flex-1 sm:w-[280px]">
            <FormSelect
              v-model="selectedPeriodId"
              :options="periodOptions"
              :placeholder="monthPlaceholder"
              :disabled="loading || !periods.length"
              :loading="loading"
            />
          </div>
        </div>

        <span
          v-if="activePeriod"
          class="inline-flex items-center text-xs px-2.5 py-1 rounded-full shrink-0"
          :style="{
            backgroundColor:
              activePeriod.status === 'OPEN'
                ? 'var(--color-primary-soft)'
                : 'var(--color-surface-elevated)',
            color:
              activePeriod.status === 'OPEN' ? 'var(--color-primary)' : 'var(--color-text-muted)',
          }"
        >
          {{ CONTABILIDAD_PERIOD_STATUS_LABELS[activePeriod.status] }}
        </span>
      </div>
    </div>
  </div>
</template>
