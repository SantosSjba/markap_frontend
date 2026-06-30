<script setup lang="ts">
import { computed } from 'vue'
import { AppIcon, BaseButton, FormSelect } from '@shared/components'
import { CONTABILIDAD_PERIOD_STATUS_LABELS } from '@modules/contabilidad/features/periodos/domain/period.types'
import { useContabilidadContext } from '../composables/useContabilidadContext'

const {
  initializing,
  initError,
  ready,
  entityOptions,
  activeEntity,
  activeLegalEntityId,
  setActiveLegalEntity,
  entities,
  activePeriod,
  periods,
  loading,
  setActivePeriod,
  setListYear,
  listYear,
  retryInit,
} = useContabilidadContext()

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

const selectedEntityId = computed({
  get: () => activeLegalEntityId.value ?? '',
  set: (value: string | number | null) => {
    const entity = (entities.value ?? []).find((e) => e.id === value)
    if (entity) void setActiveLegalEntity(entity)
  },
})

const selectedYear = computed({
  get: () => listYear.value,
  set: (value: string | number | null) => {
    const year = Number(value)
    if (Number.isFinite(year)) void setListYear(year)
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
  if (initializing.value || loading.value) return 'Cargando…'
  if (!ready.value) return 'Inicializando…'
  if (!periods.value.length) return 'Sin periodos'
  return 'Seleccionar mes…'
})

const busy = computed(() => initializing.value || loading.value)
</script>

<template>
  <section class="space-y-4 w-full">
    <p class="text-sm" :style="{ color: 'var(--color-text-secondary)' }">
      Empresa (RUC) y periodo contable activo para todas las operaciones del módulo: asientos,
      compras, ventas, tributos, libros y reportes.
    </p>

    <div
      v-if="initError"
      class="flex flex-col gap-2 rounded-lg border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
      :style="{ borderColor: 'var(--color-danger)', backgroundColor: 'var(--color-danger-soft)' }"
    >
      <p class="text-sm" :style="{ color: 'var(--color-danger)' }">
        No se pudo inicializar: {{ initError }}
      </p>
      <BaseButton variant="secondary" size="sm" @click="retryInit">Reintentar</BaseButton>
    </div>

    <div
      class="rounded-xl border p-4 sm:p-5 space-y-5 w-full"
      :style="{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }"
    >
      <div class="flex items-center gap-2" :style="{ color: 'var(--color-text-secondary)' }">
        <AppIcon icon="lucide:settings-2" :size="18" color="var(--color-primary)" />
        <span class="font-medium">Contexto contable</span>
        <AppIcon
          v-if="busy"
          icon="line-md:loading-loop"
          :size="16"
          color="var(--color-primary)"
        />
      </div>

      <div class="grid gap-5 lg:grid-cols-3">
        <div class="space-y-1.5 lg:col-span-1">
          <span class="text-xs font-medium" :style="{ color: 'var(--color-text-muted)' }">
            Empresa / RUC
          </span>
          <FormSelect
            v-model="selectedEntityId"
            :options="entityOptions"
            :loading="busy"
            :disabled="busy || !entityOptions.length"
            placeholder="Seleccionar empresa…"
          />
          <span
            v-if="activeEntity"
            class="text-xs font-mono block"
            :style="{ color: 'var(--color-text-muted)' }"
          >
            Código interno: {{ activeEntity.code }}
          </span>
        </div>

        <div class="space-y-1.5">
          <span class="text-xs font-medium" :style="{ color: 'var(--color-text-muted)' }">Año</span>
          <FormSelect
            v-model="selectedYear"
            :options="yearOptions"
            :disabled="busy || !ready"
            :loading="busy"
          />
        </div>

        <div class="space-y-1.5">
          <span class="text-xs font-medium" :style="{ color: 'var(--color-text-muted)' }">
            Periodo (mes)
          </span>
          <FormSelect
            v-model="selectedPeriodId"
            :options="periodOptions"
            :placeholder="monthPlaceholder"
            :disabled="busy || !periods.length"
            :loading="busy"
          />
          <span
            v-if="activePeriod"
            class="inline-flex text-xs px-2 py-0.5 rounded-full"
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
  </section>
</template>
