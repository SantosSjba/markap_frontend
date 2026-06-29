<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@modules/auth'
import AppIcon from '@shared/components/ui/AppIcon.vue'
import { useContabilidadActivePeriod } from '../composables/useContabilidadActivePeriod'
import { useContabilidadReportsDashboard } from '@modules/contabilidad/features/reportes-financieros/application/useContabilidadReports'
import { formatPen } from '@modules/contabilidad/features/asientos/domain/journal.utils'
import type { ContabilidadDashboardKpiDTO } from '@modules/contabilidad/features/reportes-financieros/domain/reports.types'

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
  return keys.map((key) => all.find((k) => k.key === key)).filter(Boolean) as ContabilidadDashboardKpiDTO[]
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
  return d.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })
}

const acciones = [
  { label: 'Nuevo asiento', sub: 'Contabilidad', to: '/contabilidad/asientos/libro-diario', icon: 'lucide:plus-circle' as const },
  { label: 'Facturas de compra', sub: 'Compras', to: '/contabilidad/compras/facturas', icon: 'lucide:shopping-cart' as const },
  { label: 'Balance general', sub: 'Reportes', to: '/contabilidad/reportes/balance-general', icon: 'lucide:pie-chart' as const },
  { label: 'Tesorería', sub: 'Caja y bancos', to: '/contabilidad/tesoreria/caja', icon: 'lucide:landmark' as const },
]

const toneBorder = (tone: string) => {
  if (tone === 'success') return 'var(--color-success, #16a34a)'
  if (tone === 'primary') return 'var(--color-primary)'
  return 'var(--color-border)'
}
</script>

<template>
  <div class="space-y-8 animate-fade-in">
    <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold" style="color: var(--color-text-primary)">
          Sistema contable
        </h1>
        <p class="text-sm mt-1" style="color: var(--color-text-secondary)">
          Finanzas, reportes y gestión tributaria
        </p>
        <p class="text-sm mt-3 font-medium" style="color: var(--color-text-primary)">
          {{ greeting }}, {{ firstName }}
        </p>
      </div>
      <p class="text-sm shrink-0" style="color: var(--color-text-muted)">
        {{
          new Date().toLocaleDateString('es-PE', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })
        }}
      </p>
    </div>

    <div v-if="!activePeriod" class="text-sm" :style="{ color: 'var(--color-warning)' }">
      Seleccione un periodo activo para ver indicadores.
    </div>

    <div v-else-if="isLoading" class="flex justify-center py-12">
      <AppIcon icon="svg-spinners:ring-resize" :size="32" color="var(--color-primary)" />
    </div>

    <div v-else class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        v-for="k in displayKpis"
        :key="k.key"
        class="rounded-xl border p-4 transition-shadow hover:shadow-md"
        :style="{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
          boxShadow: 'var(--shadow-sm)',
        }"
      >
        <div class="flex items-center justify-between gap-2 mb-3">
          <span class="text-xs font-medium line-clamp-2" style="color: var(--color-text-muted)">
            {{ k.label }}
          </span>
          <div
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
            style="background-color: var(--color-primary-light); color: var(--color-primary)"
          >
            <AppIcon :icon="kpiIcons[k.key] ?? 'lucide:activity'" :size="18" />
          </div>
        </div>
        <p class="text-2xl font-bold tabular-nums font-mono" style="color: var(--color-text-primary)">
          {{ formatKpi(k) }}
        </p>
        <p v-if="k.hint" class="text-xs mt-1" style="color: var(--color-text-muted)">{{ k.hint }}</p>
      </div>
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
      <div
        class="rounded-xl border p-5 lg:p-6"
        :style="{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
          boxShadow: 'var(--shadow-card)',
        }"
      >
        <h2 class="text-lg font-semibold mb-1" style="color: var(--color-text-primary)">
          Actividad reciente
        </h2>
        <p class="text-xs mb-5" style="color: var(--color-text-muted)">
          Últimos asientos publicados del periodo
        </p>
        <ul v-if="dashboard?.recentActivity?.length" class="space-y-3">
          <li
            v-for="a in dashboard.recentActivity"
            :key="a.id"
            class="flex gap-3 rounded-lg border p-3"
            :style="{
              borderColor: 'var(--color-border)',
              borderLeftWidth: '3px',
              borderLeftColor: toneBorder(a.tone),
            }"
          >
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium" style="color: var(--color-text-primary)">
                {{ a.title }}
              </p>
              <p class="text-xs mt-0.5 truncate" style="color: var(--color-text-secondary)">
                {{ a.detail }}
              </p>
            </div>
            <span class="text-[11px] shrink-0 self-start" style="color: var(--color-text-muted)">
              {{ formatActivityTime(a.occurredAt) }}
            </span>
          </li>
        </ul>
        <p v-else class="text-sm" style="color: var(--color-text-muted)">
          Sin actividad publicada en este periodo.
        </p>
      </div>

      <div
        class="rounded-xl border p-5 lg:p-6"
        :style="{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
          boxShadow: 'var(--shadow-card)',
        }"
      >
        <h2 class="text-lg font-semibold mb-1" style="color: var(--color-text-primary)">
          Acciones rápidas
        </h2>
        <p class="text-xs mb-5" style="color: var(--color-text-muted)">
          Tareas frecuentes
        </p>
        <div class="grid sm:grid-cols-2 gap-3">
          <button
            v-for="ac in acciones"
            :key="ac.to"
            type="button"
            class="flex items-start gap-3 rounded-xl border p-4 text-left transition-all hover-surface"
            :style="{ borderColor: 'var(--color-border)' }"
            @click="router.push(ac.to)"
          >
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              style="background-color: var(--color-primary-light); color: var(--color-primary)"
            >
              <AppIcon :icon="ac.icon" :size="20" />
            </div>
            <div class="min-w-0">
              <p class="text-sm font-semibold" style="color: var(--color-text-primary)">
                {{ ac.label }}
              </p>
              <p class="text-xs mt-0.5" style="color: var(--color-text-muted)">
                {{ ac.sub }}
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
