<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import BaseCard from '@shared/presentation/components/ui/BaseCard.vue'
import BaseTabs from '@shared/presentation/components/ui/BaseTabs.vue'
import BaseButton from '@shared/presentation/components/ui/BaseButton.vue'
import StatsCard from '@shared/presentation/components/ui/StatsCard.vue'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { useReportsSummary } from '../composables/useReportes'
import ExpiringContractsTab from '../components/ExpiringContractsTab.vue'
import PropertiesWithoutContractTab from '../components/PropertiesWithoutContractTab.vue'
import ActiveClientsTab from '../components/ActiveClientsTab.vue'
import RentalCommissionsTab from '../components/RentalCommissionsTab.vue'
import PortfolioIndicatorsTab from '../components/PortfolioIndicatorsTab.vue'
/**
 * Reportes de Alquileres: resumen compacto arriba y una pestaña por reporte.
 * Cada pestaña carga sus datos, filtros y exportación; la pestaña activa queda en la URL (?tab=).
 */

const route = useRoute()
const router = useRouter()

const reportTabs = [
  { id: 'contratos-por-vencer', label: 'Contratos por vencer', icon: 'lucide:calendar-clock' },
  { id: 'sin-contrato', label: 'Sin contrato', icon: 'lucide:building-2' },
  { id: 'clientes-activos', label: 'Clientes activos', icon: 'lucide:users' },
  { id: 'comisiones', label: 'Comisiones de alquileres', icon: 'lucide:bar-chart-2' },
  { id: 'indicadores', label: 'Indicadores', icon: 'lucide:gauge' },
] as const
type ReportTab = (typeof reportTabs)[number]['id']

const activeTab = computed<ReportTab>({
  get: () => {
    const tab = route.query.tab
    return reportTabs.some((t) => t.id === tab) ? (tab as ReportTab) : 'contratos-por-vencer'
  },
  set: (tab) => {
    void router.replace({ query: { ...route.query, tab } })
  },
})

/** Días del reporte de contratos por vencer (también cuenta en la tarjeta de resumen) */
const expiringDays = ref(30)

const summaryQuery = useReportsSummary('alquileres', expiringDays)
const summary = computed(
  () =>
    summaryQuery.data.value ?? {
      contratosPorVencer: 0,
      propiedadesSinContrato: 0,
      clientesActivos: 0,
      clientesConIncidencias: 0,
    },
)
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="Reportes" subtitle="Análisis y exportación de datos de alquileres" />

    <!-- Resumen -->
    <BaseCard v-if="summaryQuery.isError.value" class="block text-center space-y-3">
      <p class="text-sm text-error-500 dark:text-error-400">{{ getApiErrorMessage(summaryQuery.error.value) }}</p>
      <BaseButton variant="outline" size="sm" @click="() => summaryQuery.refetch()">Reintentar</BaseButton>
    </BaseCard>
    <div v-else class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <StatsCard
        compact
        title="Contratos por vencer"
        :value="String(summary.contratosPorVencer)"
        :subtitle="`próx. ${expiringDays} días`"
        :loading="summaryQuery.isPending.value"
      >
        <template #icon><AppIcon icon="lucide:calendar-clock" :size="20" /></template>
      </StatsCard>
      <StatsCard
        compact
        title="Propiedades sin contrato"
        :value="String(summary.propiedadesSinContrato)"
        :loading="summaryQuery.isPending.value"
      >
        <template #icon><AppIcon icon="lucide:building-2" :size="20" /></template>
      </StatsCard>
      <StatsCard
        compact
        title="Clientes activos"
        :value="String(summary.clientesActivos)"
        :loading="summaryQuery.isPending.value"
      >
        <template #icon><AppIcon icon="lucide:users" :size="20" /></template>
      </StatsCard>
      <StatsCard
        compact
        title="Clientes con incidencias"
        :value="String(summary.clientesConIncidencias)"
        subtitle="pagos atrasados"
        :loading="summaryQuery.isPending.value"
      >
        <template #icon><AppIcon icon="lucide:triangle-alert" :size="20" /></template>
      </StatsCard>
    </div>

    <BaseTabs v-model="activeTab" :tabs="reportTabs" />

    <BaseCard class="block">
      <ExpiringContractsTab v-if="activeTab === 'contratos-por-vencer'" v-model:days="expiringDays" />
      <PropertiesWithoutContractTab v-else-if="activeTab === 'sin-contrato'" />
      <ActiveClientsTab v-else-if="activeTab === 'clientes-activos'" />
      <RentalCommissionsTab v-else-if="activeTab === 'comisiones'" />
      <PortfolioIndicatorsTab v-else />
    </BaseCard>
  </div>
</template>
