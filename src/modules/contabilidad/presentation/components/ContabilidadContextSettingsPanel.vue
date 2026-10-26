<script setup lang="ts">
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import Badge from '@shared/presentation/components/ui/Badge.vue'
import { computed } from 'vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import FormSelect from '@shared/presentation/components/forms/FormSelect.vue'
import { CONTABILIDAD_PERIOD_STATUS_LABELS } from '../../features/periodos/domain/period.types'
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
    <p class="text-sm text-gray-500 dark:text-gray-400">
      Empresa (RUC) y periodo contable activo para todas las operaciones del módulo: asientos,
      compras, ventas, tributos, libros y reportes.
    </p>

    <div
      v-if="initError"
      class="flex flex-col gap-2 rounded-lg border px-4 py-3 sm:flex-row sm:items-center sm:justify-between border-error-500 bg-error-50 dark:bg-error-500/15"
    >
      <p class="text-sm text-error-500 dark:text-error-400">
        No se pudo inicializar: {{ initError }}
      </p>
      <BaseButton variant="secondary" size="sm" @click="retryInit">Reintentar</BaseButton>
    </div>

    <BaseCard padding="sm" class="block space-y-5 w-full">
      <div class="flex items-center gap-2 text-gray-500 dark:text-gray-400">
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
          <span class="text-xs font-medium text-gray-400 dark:text-gray-500">
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
            class="text-xs font-mono block text-gray-400 dark:text-gray-500"
          >
            Código interno: {{ activeEntity.code }}
          </span>
        </div>

        <div class="space-y-1.5">
          <span class="text-xs font-medium text-gray-400 dark:text-gray-500">Año</span>
          <FormSelect
            v-model="selectedYear"
            :options="yearOptions"
            :disabled="busy || !ready"
            :loading="busy"
          />
        </div>

        <div class="space-y-1.5">
          <span class="text-xs font-medium text-gray-400 dark:text-gray-500">
            Periodo (mes)
          </span>
          <FormSelect
            v-model="selectedPeriodId"
            :options="periodOptions"
            :placeholder="monthPlaceholder"
            :disabled="busy || !periods.length"
            :loading="busy"
          />
          <Badge v-if="activePeriod" :variant="activePeriod.status === 'OPEN' ? 'primary' : 'neutral'">{{ CONTABILIDAD_PERIOD_STATUS_LABELS[activePeriod.status] }}</Badge>
        </div>
      </div>
    </BaseCard>
  </section>
</template>
