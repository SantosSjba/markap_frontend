<script setup lang="ts">
import FormSectionCard from '@shared/presentation/components/forms/FormSectionCard.vue'
import PageHeader from '@shared/presentation/components/ui/PageHeader.vue'
import LoadingState from '@shared/presentation/components/ui/LoadingState.vue'
import ActionCard from '@shared/presentation/components/ui/ActionCard.vue'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@modules/auth/presentation/stores/auth.store'
import AppIcon from '@shared/presentation/components/ui/AppIcon.vue'
import { useContabilidadActivePeriod } from '../composables/useContabilidadActivePeriod'
import { useContabilidadReportsDashboard } from '../../features/reportes-financieros/presentation/composables/useContabilidadReports'
import { formatPen } from '../../features/asientos/domain/journal.utils'
import type { ContabilidadDashboardKpiDTO } from '../../features/reportes-financieros/domain/reports.types'
import { formatDate } from '@shared/utils/formatters'
const router = useRouter()
const authStore = useAuthStore()
const { activePeriod } = useContabilidadActivePeriod()
const periodId = computed(() => activePeriod.value?.id)

const { data: dashboard, isLoading } = useContabilidadReportsDashboard(periodId)

const greetingHour = new Date().getHours()
const greeting =
  greetingHour < 12 ? 'Buenos días' : greetingHour < 19 ? 'Buenas tardes' : 'Buenas noches'
const firstName = computed(() => authStore.user?.firstName ?? 'Usuario')

const kpiIcons: Record<string, string> = {
  posted_entries: 'lucide:book-open',
  net_income: 'lucide:trending-up',
  liquidity: 'lucide:droplets',
  cxc: 'lucide:hand-coins',
  cxp: 'lucide:credit-card',
  igv_balance: 'lucide:percent',
  cash_bank: 'lucide:landmark',
  total_assets: 'lucide:scale',
}

const displayKpis = computed(() => {
  const all = dashboard.value?.kpis ?? []
  const keys = ['posted_entries', 'net_income', 'cxc', 'igv_balance']
  return keys
    .map((key) => all.find((k) => k.key === key))
    .filter(Boolean) as ContabilidadDashboardKpiDTO[]
})

function formatKpi(kpi: ContabilidadDashboardKpiDTO) {
  if (kpi.format === 'money') return formatPen(kpi.value)
  return kpi.value
}

function formatActivityTime(iso: string) {
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  const h = Math.floor(diff / 3_600_000)
  if (h < 1) return 'Hace poco'
  if (h < 24) return `Hace ${h} h`
  return formatDate(iso, { day: 'numeric', month: 'short' })
}

const acciones = [
  {
    label: 'Nuevo asiento',
    sub: 'Contabilidad',
    to: '/contabilidad/asientos/libro-diario',
    icon: 'lucide:plus-circle' as const,
  },
  {
    label: 'Facturas de compra',
    sub: 'Compras',
    to: '/contabilidad/compras/facturas',
    icon: 'lucide:shopping-cart' as const,
  },
  {
    label: 'Balance general',
    sub: 'Reportes',
    to: '/contabilidad/reportes/balance-general',
    icon: 'lucide:pie-chart' as const,
  },
  {
    label: 'Tesorería',
    sub: 'Caja y bancos',
    to: '/contabilidad/tesoreria/caja',
    icon: 'lucide:landmark' as const,
  },
]

const toneBorder = (tone: string) => {
  if (tone === 'success') return 'border-l-success-500'
  if (tone === 'primary') return 'border-l-brand-500'
  return 'border-l-gray-200 dark:border-l-gray-800'
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Sistema contable"
    >
      <template #subtitle>
        Finanzas, reportes y gestión tributaria
<span class="mt-2 block">{{ greeting }}, {{ firstName }}</span>
      </template>
      <template #actions>
        <p class="text-sm shrink-0 text-gray-400 dark:text-gray-500">
        {{
          formatDate(new Date(), {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })
        }}
      </p>
      </template>
    </PageHeader>

    <div v-if="!activePeriod" class="text-sm text-warning-600 dark:text-orange-400">
      Configure el periodo activo en Configuración → Contexto contable para ver indicadores.
    </div>

    <LoadingState v-else-if="isLoading" class="py-12" />

    <div v-else class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        v-for="k in displayKpis"
        :key="k.key"
        class="rounded-xl border p-4 transition-shadow hover:shadow-md bg-white dark:bg-gray-dark border-gray-200 dark:border-gray-800 shadow-theme-xs"
      >
        <div class="flex items-center justify-between gap-2 mb-3">
          <span class="text-xs font-medium line-clamp-2 text-gray-400 dark:text-gray-500">
            {{ k.label }}
          </span>
          <div
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-500/12 text-brand-500 dark:text-brand-400"
          >
            <AppIcon :icon="kpiIcons[k.key] ?? 'lucide:activity'" :size="18" />
          </div>
        </div>
        <p class="text-2xl font-bold tabular-nums font-mono text-gray-800 dark:text-white/90">
          {{ formatKpi(k) }}
        </p>
        <p v-if="k.hint" class="text-xs mt-1 text-gray-400 dark:text-gray-500">{{ k.hint }}</p>
      </div>
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
      <FormSectionCard
        title="Actividad reciente"
        subtitle="Últimos asientos publicados del periodo"
        dense
      >
        <ul v-if="dashboard?.recentActivity?.length" class="space-y-3">
          <li
            v-for="a in dashboard.recentActivity"
            :key="a.id"
            class="flex gap-3 rounded-lg border p-3 border-gray-200 dark:border-gray-800 border-l-3" :class="toneBorder(a.tone)"
          >
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-gray-800 dark:text-white/90">
                {{ a.title }}
              </p>
              <p class="text-xs mt-0.5 truncate text-gray-500 dark:text-gray-400">
                {{ a.detail }}
              </p>
            </div>
            <span class="text-[11px] shrink-0 self-start text-gray-400 dark:text-gray-500">
              {{ formatActivityTime(a.occurredAt) }}
            </span>
          </li>
        </ul>
        <p v-else class="text-sm text-gray-400 dark:text-gray-500">
          Sin actividad publicada en este periodo.
        </p>
      </FormSectionCard>

      <FormSectionCard
        title="Acciones rápidas"
        subtitle="Tareas frecuentes"
        dense
      >
        <div class="grid sm:grid-cols-2 gap-3">
          <ActionCard
            v-for="ac in acciones"
            :key="ac.to"
            :icon="ac.icon"
            :title="ac.label"
            :description="ac.sub"
            @click="router.push(ac.to)"
          />
        </div>
      </FormSectionCard>
    </div>
  </div>
</template>
