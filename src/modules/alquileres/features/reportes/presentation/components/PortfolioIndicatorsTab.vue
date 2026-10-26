<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import StatsCard from '@shared/presentation/components/ui/StatsCard.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import { useContractStatusSummary, useMonthlyMetrics } from '../composables/useReportes'
import ReportQueryError from './ReportQueryError.vue'
/**
 * Pestaña «Indicadores»: distribución de los contratos vigentes por tiempo restante
 * y métricas del mes en curso. Antes vivían debajo de todas las pestañas.
 */

const statusQuery = useContractStatusSummary('alquileres')
const metricsQuery = useMonthlyMetrics('alquileres')

const segments = computed(() => {
  const s = statusQuery.data.value ?? { vigentes: 0, porVencer: 0, proximos: 0, urgentes: 0 }
  return [
    { label: 'Más de 90 días', value: s.vigentes, bar: 'bg-success-500', dot: 'bg-success-500' },
    { label: '61 a 90 días', value: s.porVencer, bar: 'bg-blue-light-500', dot: 'bg-blue-light-500' },
    { label: '31 a 60 días', value: s.proximos, bar: 'bg-warning-500', dot: 'bg-warning-500' },
    { label: '30 días o menos', value: s.urgentes, bar: 'bg-error-500', dot: 'bg-error-500' },
  ]
})
const totalContracts = computed(() => segments.value.reduce((acc, s) => acc + s.value, 0))
const percent = (value: number) =>
  totalContracts.value ? Math.round((value / totalContracts.value) * 100) : 0

const metrics = computed(
  () =>
    metricsQuery.data.value ?? {
      tasaOcupacion: 0,
      tasaCobranza: 0,
      contratosRenovados: 0,
      clientesNuevos: 0,
    },
)
</script>

<template>
  <div class="space-y-6">
    <!-- Métricas del mes -->
    <section>
      <h2 class="mb-3 text-base font-semibold text-gray-800 dark:text-white/90">Métricas del mes</h2>
      <ReportQueryError v-if="metricsQuery.isError.value" :error="metricsQuery.error.value" @retry="() => metricsQuery.refetch()" />
      <div v-else class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatsCard
          compact
          title="Ocupación"
          :value="`${metrics.tasaOcupacion}%`"
          subtitle="propiedades alquiladas"
          :loading="metricsQuery.isPending.value"
        >
          <template #icon><AppIcon icon="lucide:home" :size="20" /></template>
        </StatsCard>
        <StatsCard
          compact
          title="Cobranza"
          :value="`${metrics.tasaCobranza}%`"
          subtitle="cuotas del mes"
          :loading="metricsQuery.isPending.value"
        >
          <template #icon><AppIcon icon="lucide:wallet" :size="20" /></template>
        </StatsCard>
        <StatsCard
          compact
          title="Renovados"
          :value="String(metrics.contratosRenovados)"
          subtitle="este mes"
          :loading="metricsQuery.isPending.value"
        >
          <template #icon><AppIcon icon="lucide:refresh-cw" :size="20" /></template>
        </StatsCard>
        <StatsCard
          compact
          title="Clientes nuevos"
          :value="String(metrics.clientesNuevos)"
          subtitle="este mes"
          :loading="metricsQuery.isPending.value"
        >
          <template #icon><AppIcon icon="lucide:user-plus" :size="20" /></template>
        </StatsCard>
      </div>
    </section>

    <!-- Estado de los contratos vigentes -->
    <section>
      <div class="mb-3 flex items-baseline justify-between gap-2">
        <h2 class="text-base font-semibold text-gray-800 dark:text-white/90">Contratos vigentes por tiempo restante</h2>
        <span class="text-sm text-gray-500 dark:text-gray-400">{{ totalContracts }} contratos</span>
      </div>
      <LoadingState v-if="statusQuery.isPending.value" class="py-8" />
      <ReportQueryError v-else-if="statusQuery.isError.value" :error="statusQuery.error.value" @retry="() => statusQuery.refetch()" />
      <template v-else>
        <!-- Barra apilada: proporción de cada tramo -->
        <div class="flex h-3 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
          <div
            v-for="s in segments"
            :key="s.label"
            :class="s.bar"
            class="h-full transition-all duration-300"
            :style="{ width: `${percent(s.value)}%` }"
            :title="`${s.label}: ${s.value}`"
          />
        </div>
        <ul class="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
          <li v-for="s in segments" :key="s.label" class="flex items-center gap-2 text-sm">
            <span class="size-2.5 shrink-0 rounded-full" :class="s.dot" />
            <span class="text-gray-500 dark:text-gray-400">{{ s.label }}</span>
            <span class="ml-auto font-semibold tabular-nums text-gray-800 dark:text-white/90">{{ s.value }}</span>
          </li>
        </ul>
      </template>
    </section>
  </div>
</template>
